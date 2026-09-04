"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeExerciseSchema = void 0;
exports.getLessons = getLessons;
exports.getLesson = getLesson;
exports.completeExercise = completeExercise;
const zod_1 = require("zod");
const Lesson_1 = __importDefault(require("../models/Lesson"));
const Exercise_1 = __importDefault(require("../models/Exercise"));
const LessonProgress_1 = __importDefault(require("../models/LessonProgress"));
const wpm_service_1 = require("../services/wpm.service");
const streak_service_1 = require("../services/streak.service");
const achievement_service_1 = require("../services/achievement.service");
const gamification_service_1 = require("../services/gamification.service");
const lessonContent_service_1 = require("../services/lessonContent.service");
const response_1 = require("../utils/response");
const typedWordSchema = zod_1.z.object({ word: zod_1.z.string(), typed: zod_1.z.string(), correct: zod_1.z.boolean(), timeTakenMs: zod_1.z.number().min(0) });
exports.completeExerciseSchema = zod_1.z.object({ startTime: zod_1.z.string().datetime(), endTime: zod_1.z.string().datetime(), typedWords: zod_1.z.array(typedWordSchema).min(1), variantIndex: zod_1.z.number().int().min(0).max(99).optional() });
async function lessonAccess(userId, lesson) {
    if (lesson.order === 1)
        return true;
    // Guests have no saved progress, so only the first lesson is open for them.
    if (!userId)
        return false;
    const previous = await Lesson_1.default.findOne({ isActive: true, order: lesson.order - 1 });
    if (!previous)
        return false;
    return Boolean(await LessonProgress_1.default.exists({ userId, lessonId: previous._id, completedAt: { $exists: true } }));
}
async function getLessons(req, res) {
    try {
        const userId = req.user?._id;
        const [lessons, progress, exerciseCounts] = await Promise.all([
            Lesson_1.default.find({ isActive: true }).sort({ order: 1 }),
            userId ? LessonProgress_1.default.find({ userId }) : Promise.resolve([]),
            Exercise_1.default.aggregate([
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
        (0, response_1.sendSuccess)(res, { lessons: course });
    }
    catch (err) {
        console.error('getLessons error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch lessons', 500);
    }
}
async function getLesson(req, res) {
    try {
        const lesson = await Lesson_1.default.findById(req.params['id']);
        if (!lesson || !lesson.isActive) {
            (0, response_1.sendError)(res, 'Lesson not found', 404);
            return;
        }
        if (!await lessonAccess(req.user?._id, lesson)) {
            (0, response_1.sendError)(res, 'Complete the previous level to unlock this lesson.', 403);
            return;
        }
        const [exerciseDocs, progress] = await Promise.all([
            Exercise_1.default.find({ lessonId: lesson._id, isActive: true }).sort({ order: 1 }),
            req.user?._id ? LessonProgress_1.default.findOne({ userId: req.user._id, lessonId: lesson._id }) : null,
        ]);
        // Each fetch serves one pre-written variant per exercise. Authed users get
        // a variant they have NOT seen before (pool reshuffles once exhausted);
        // guests get a random pick. The client echoes variantIndex back on
        // completion so the server can regenerate the same text.
        let progressDirty = false;
        const exercises = exerciseDocs.map((exercise) => {
            const variants = (0, lessonContent_service_1.getExerciseVariants)(lesson.order, exercise.order, exercise.content);
            let variantIndex;
            const attempt = progress?.exercises.find((item) => item.exerciseId.toString() === exercise._id.toString());
            if (progress && attempt) {
                const seen = attempt.seenVariantIndices ?? [];
                const unseen = variants.map((_, i) => i).filter((i) => !seen.includes(i));
                if (unseen.length > 0) {
                    variantIndex = unseen[Math.floor(Math.random() * unseen.length)];
                    attempt.seenVariantIndices = [...seen, variantIndex];
                }
                else {
                    // Every variant has been shown — reshuffle the pool and restart.
                    variantIndex = Math.floor(Math.random() * variants.length);
                    attempt.seenVariantIndices = [variantIndex];
                }
                progressDirty = true;
            }
            else if (progress) {
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
            }
            else {
                variantIndex = Math.floor(Math.random() * variants.length);
            }
            return { ...exercise.toObject(), content: variants[variantIndex], variantIndex, variants };
        });
        if (progress && progressDirty)
            await progress.save().catch(() => undefined);
        (0, response_1.sendSuccess)(res, { lesson, exercises, progress });
    }
    catch (err) {
        console.error('getLesson error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch lesson', 500);
    }
}
async function completeExercise(req, res) {
    try {
        const lesson = await Lesson_1.default.findById(req.params['id']);
        const exercise = await Exercise_1.default.findOne({ _id: req.params['exerciseId'], lessonId: req.params['id'], isActive: true });
        if (!lesson || !exercise) {
            (0, response_1.sendError)(res, 'Lesson exercise not found', 404);
            return;
        }
        if (!await lessonAccess(req.user._id, lesson)) {
            (0, response_1.sendError)(res, 'Complete the previous level to unlock this lesson.', 403);
            return;
        }
        const body = req.body;
        const candidateTexts = [exercise.content];
        if (typeof body.variantIndex === 'number') {
            const variant = (0, lessonContent_service_1.getExerciseVariants)(lesson.order, exercise.order, exercise.content)[body.variantIndex];
            if (variant)
                candidateTexts.unshift(variant);
        }
        let matchedWords = null;
        for (const text of candidateTexts) {
            const words = text.trim().split(/\s+/);
            if (body.typedWords.length <= words.length && body.typedWords.every((word, index) => word.word === words[index])) {
                matchedWords = words;
                break;
            }
        }
        if (!matchedWords) {
            (0, response_1.sendError)(res, 'Attempt does not match this exercise.', 400);
            return;
        }
        const durationSeconds = Math.max(1, Math.round((new Date(body.endTime).getTime() - new Date(body.startTime).getTime()) / 1000));
        const stats = (0, wpm_service_1.computeStats)(body.typedWords, durationSeconds);
        const now = new Date();
        const progress = await LessonProgress_1.default.findOneAndUpdate({ userId: req.user._id, lessonId: lesson._id }, { $setOnInsert: { userId: req.user._id, lessonId: lesson._id, completedExerciseIds: [], exercises: [] } }, { new: true, upsert: true });
        const exerciseProgress = progress.exercises.find((item) => item.exerciseId.toString() === exercise._id.toString());
        if (exerciseProgress) {
            exerciseProgress.attempts += 1;
            exerciseProgress.bestAccuracy = Math.max(exerciseProgress.bestAccuracy, stats.accuracy);
            exerciseProgress.timeSpentSeconds += durationSeconds;
            exerciseProgress.lastPracticed = now;
        }
        else
            progress.exercises.push({ exerciseId: exercise._id, attempts: 1, bestAccuracy: stats.accuracy, timeSpentSeconds: durationSeconds, lastPracticed: now, seenVariantIndices: [] });
        progress.attempts += 1;
        progress.bestAccuracy = Math.max(progress.bestAccuracy, stats.accuracy);
        progress.timeSpentSeconds += durationSeconds;
        progress.lastPracticed = now;
        const passed = body.typedWords.length === matchedWords.length && stats.accuracy >= lesson.accuracyThreshold;
        if (passed && !progress.completedExerciseIds.some((id) => id.toString() === exercise._id.toString()))
            progress.completedExerciseIds.push(exercise._id);
        const totalExercises = await Exercise_1.default.countDocuments({ lessonId: lesson._id, isActive: true });
        const lessonCompleted = progress.completedExerciseIds.length === totalExercises;
        const wasCompleted = Boolean(progress.completedAt);
        const justCompleted = lessonCompleted && !wasCompleted;
        if (justCompleted)
            progress.completedAt = now;
        await progress.save();
        // Gamification
        let xpEarned = 0;
        const breakdown = [];
        if (passed) {
            breakdown.push({ label: 'Exercise passed', value: gamification_service_1.XP_VALUES.lessonExercisePassed });
            xpEarned += gamification_service_1.XP_VALUES.lessonExercisePassed;
            await (0, streak_service_1.updateStreak)(req.user._id);
        }
        if (justCompleted) {
            breakdown.push({ label: 'Lesson complete', value: gamification_service_1.XP_VALUES.lessonCompleteBonus });
            xpEarned += gamification_service_1.XP_VALUES.lessonCompleteBonus;
        }
        const newAchievements = await (0, achievement_service_1.checkAndAwardAchievements)(req.user._id);
        const achievementBonus = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
        xpEarned += achievementBonus;
        const award = await (0, gamification_service_1.awardXp)(req.user._id, xpEarned);
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (err) {
        console.error('completeExercise error:', err);
        (0, response_1.sendError)(res, 'Failed to save exercise progress', 500);
    }
}
//# sourceMappingURL=lesson.controller.js.map