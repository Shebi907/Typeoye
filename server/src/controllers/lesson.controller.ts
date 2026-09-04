import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Lesson from '../models/Lesson';
import Exercise from '../models/Exercise';
import LessonProgress from '../models/LessonProgress';
import { computeStats } from '../services/wpm.service';
import { updateStreak } from '../services/streak.service';
import { checkAndAwardAchievements } from '../services/achievement.service';
import { XP_VALUES, awardXp } from '../services/gamification.service';
import { getExerciseVariants } from '../services/lessonContent.service';
import { sendSuccess, sendError } from '../utils/response';

const typedWordSchema = z.object({ word: z.string(), typed: z.string(), correct: z.boolean(), timeTakenMs: z.number().min(0) });
export const completeExerciseSchema = z.object({ startTime: z.string().datetime(), endTime: z.string().datetime(), typedWords: z.array(typedWordSchema).min(1), variantIndex: z.number().int().min(0).max(99).optional() });

async function lessonAccess(userId: unknown, lesson: { order: number; _id: unknown }) {
  if (lesson.order === 1) return true;
  // Guests have no saved progress, so only the first lesson is open for them.
  if (!userId) return false;
  const previous = await Lesson.findOne({ isActive: true, order: lesson.order - 1 });
  if (!previous) return false;
  return Boolean(await LessonProgress.exists({ userId, lessonId: previous._id, completedAt: { $exists: true } }));
}

export async function getLessons(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    const [lessons, progress, exerciseCounts] = await Promise.all([
      Lesson.find({ isActive: true }).sort({ order: 1 }),
      userId ? LessonProgress.find({ userId }) : Promise.resolve([] as never[]),
      Exercise.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { isActive: true } },
        { $group: { _id: '$lessonId', count: { $sum: 1 } } },
      ]),
    ]);
    const progressByLesson = new Map(progress.map((item) => [item.lessonId.toString(), item]));
    const countByLesson = new Map(exerciseCounts.map((row) => [row._id.toString(), row.count]));
    const course = lessons.map((lesson) => {
      const item = progressByLesson.get(lesson._id.toString());
      const completed = Boolean(item?.completedAt);
      const unlocked = lesson.order === 1 || Boolean(progressByLesson.get(lessons.find((candidate) => candidate.order === lesson.order - 1)?._id.toString() ?? '')?.completedAt);
      return {
        ...lesson.toObject(),
        unlocked,
        completed,
        completedExercises: item?.completedExerciseIds.length ?? 0,
        exerciseCount: countByLesson.get(lesson._id.toString()) ?? 0,
        bestAccuracy: item?.bestAccuracy ?? 0,
        attempts: item?.attempts ?? 0,
      };
    });
    sendSuccess(res, { lessons: course });
  } catch (err) { console.error('getLessons error:', err); sendError(res, 'Failed to fetch lessons', 500); }
}

export async function getLesson(req: Request, res: Response): Promise<void> {
  try {
    const lesson = await Lesson.findById(req.params['id']);
    if (!lesson || !lesson.isActive) { sendError(res, 'Lesson not found', 404); return; }
    if (!await lessonAccess(req.user?._id, lesson)) { sendError(res, 'Complete the previous level to unlock this lesson.', 403); return; }
    const [exerciseDocs, progress] = await Promise.all([
      Exercise.find({ lessonId: lesson._id, isActive: true }).sort({ order: 1 }),
      req.user?._id ? LessonProgress.findOne({ userId: req.user._id, lessonId: lesson._id }) : null,
    ]);
    // Each fetch serves one pre-written variant per exercise. Authed users get
    // a variant they have NOT seen before (pool reshuffles once exhausted);
    // guests get a random pick. The client echoes variantIndex back on
    // completion so the server can regenerate the same text.
    let progressDirty = false;
    const exercises = exerciseDocs.map((exercise) => {
      const variants = getExerciseVariants(lesson.order, exercise.order, exercise.content);
      let variantIndex: number;
      const attempt = progress?.exercises.find((item) => item.exerciseId.toString() === exercise._id.toString());
      if (progress && attempt) {
        const seen = attempt.seenVariantIndices ?? [];
        const unseen = variants.map((_, i) => i).filter((i) => !seen.includes(i));
        if (unseen.length > 0) {
          variantIndex = unseen[Math.floor(Math.random() * unseen.length)];
          attempt.seenVariantIndices = [...seen, variantIndex];
        } else {
          // Every variant has been shown — reshuffle the pool and restart.
          variantIndex = Math.floor(Math.random() * variants.length);
          attempt.seenVariantIndices = [variantIndex];
        }
        progressDirty = true;
      } else if (progress) {
        variantIndex = Math.floor(Math.random() * variants.length);
        progress.exercises.push({
          exerciseId: exercise._id,
          attempts: 0,
          bestAccuracy: 0,
          timeSpentSeconds: 0,
          lastPracticed: new Date(),
          seenVariantIndices: [variantIndex],
        });
        progressDirty = true;
      } else {
        variantIndex = Math.floor(Math.random() * variants.length);
      }
      return { ...exercise.toObject(), content: variants[variantIndex], variantIndex, variants };
    });
    if (progress && progressDirty) await progress.save().catch(() => undefined);
    sendSuccess(res, { lesson, exercises, progress });
  } catch (err) { console.error('getLesson error:', err); sendError(res, 'Failed to fetch lesson', 500); }
}

export async function completeExercise(req: Request, res: Response): Promise<void> {
  try {
    const lesson = await Lesson.findById(req.params['id']);
    const exercise = await Exercise.findOne({ _id: req.params['exerciseId'], lessonId: req.params['id'], isActive: true });
    if (!lesson || !exercise) { sendError(res, 'Lesson exercise not found', 404); return; }
    if (!await lessonAccess(req.user!._id, lesson)) { sendError(res, 'Complete the previous level to unlock this lesson.', 403); return; }
    const body = req.body as z.infer<typeof completeExerciseSchema>;
    const candidateTexts = [exercise.content];
    if (typeof body.variantIndex === 'number') {
      const variant = getExerciseVariants(lesson.order, exercise.order, exercise.content)[body.variantIndex];
      if (variant) candidateTexts.unshift(variant);
    }
    let matchedWords: string[] | null = null;
    for (const text of candidateTexts) {
      const words = text.trim().split(/\s+/);
      if (body.typedWords.length <= words.length && body.typedWords.every((word, index) => word.word === words[index])) { matchedWords = words; break; }
    }
    if (!matchedWords) { sendError(res, 'Attempt does not match this exercise.', 400); return; }
    const durationSeconds = Math.max(1, Math.round((new Date(body.endTime).getTime() - new Date(body.startTime).getTime()) / 1000));
    const stats = computeStats(body.typedWords, durationSeconds);
    const now = new Date();
    const progress = await LessonProgress.findOneAndUpdate(
      { userId: req.user!._id, lessonId: lesson._id },
      { $setOnInsert: { userId: req.user!._id, lessonId: lesson._id, completedExerciseIds: [], exercises: [] } },
      { new: true, upsert: true }
    );
    const exerciseProgress = progress.exercises.find((item) => item.exerciseId.toString() === exercise._id.toString());
    if (exerciseProgress) {
      exerciseProgress.attempts += 1; exerciseProgress.bestAccuracy = Math.max(exerciseProgress.bestAccuracy, stats.accuracy); exerciseProgress.timeSpentSeconds += durationSeconds; exerciseProgress.lastPracticed = now;
    } else progress.exercises.push({ exerciseId: exercise._id, attempts: 1, bestAccuracy: stats.accuracy, timeSpentSeconds: durationSeconds, lastPracticed: now, seenVariantIndices: [] });
    progress.attempts += 1; progress.bestAccuracy = Math.max(progress.bestAccuracy, stats.accuracy); progress.timeSpentSeconds += durationSeconds; progress.lastPracticed = now;
    const passed = body.typedWords.length === matchedWords.length && stats.accuracy >= lesson.accuracyThreshold;
    if (passed && !progress.completedExerciseIds.some((id) => id.toString() === exercise._id.toString())) progress.completedExerciseIds.push(exercise._id);
    const totalExercises = await Exercise.countDocuments({ lessonId: lesson._id, isActive: true });
    const lessonCompleted = progress.completedExerciseIds.length === totalExercises;
    const wasCompleted = Boolean(progress.completedAt);
    const justCompleted = lessonCompleted && !wasCompleted;
    if (justCompleted) progress.completedAt = now;
    await progress.save();

    // Gamification
    let xpEarned = 0;
    const breakdown: { label: string; value: number }[] = [];

    if (passed) {
      breakdown.push({ label: 'Exercise passed', value: XP_VALUES.lessonExercisePassed });
      xpEarned += XP_VALUES.lessonExercisePassed;
      await updateStreak(req.user!._id);
    }
    if (justCompleted) {
      breakdown.push({ label: 'Lesson complete', value: XP_VALUES.lessonCompleteBonus });
      xpEarned += XP_VALUES.lessonCompleteBonus;
    }

    const newAchievements = await checkAndAwardAchievements(req.user!._id);
    const achievementBonus = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
    xpEarned += achievementBonus;

    const award = await awardXp(req.user!._id, xpEarned);

    sendSuccess(res, {
      stats,
      passed,
      lessonCompleted,
      progress,
      nextLessonUnlocked: lessonCompleted,
      xpEarned,
      xpBreakdown: breakdown,
      newAchievements,
      leveledUp: award.leveledUp,
      prevXP: award.prevXP,
      newXP: award.newXP,
      level: award.newLevel,
      levelTitle: award.levelTitle,
      prevLevel: award.prevLevel,
    });
  } catch (err) { console.error('completeExercise error:', err); sendError(res, 'Failed to save exercise progress', 500); }
}