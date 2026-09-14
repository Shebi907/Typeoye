import { Types } from 'mongoose';
import TypingSession from '../models/TypingSession';
import TypingResult from '../models/TypingResult';
import UserProgress from '../models/UserProgress';
import WeakKey from '../models/WeakKey';
import Streak from '../models/Streak';
import PracticeSession from '../models/PracticeSession';
import Lesson from '../models/Lesson';
import LessonProgress from '../models/LessonProgress';
import Exercise from '../models/Exercise';
import { computeStats, computeWeakKeys } from './wpm.service';
import { updateStreak, isSameDay } from './streak.service';
import { checkAndAwardAchievements } from './achievement.service';
import { computeSessionXp, awardXp } from './gamification.service';
import { WEAK_KEY_MIN_ATTEMPTS, WEAK_KEY_MIN_ERROR_RATE } from '../models/WeakKey';

export interface TypedWordInput {
  word: string;
  typed: string;
  correct: boolean;
  timeTakenMs: number;
}

export interface SessionInput {
  mode: 'test' | 'practice' | 'lesson' | 'game';
  startTime: string;
  endTime: string;
  typedWords: TypedWordInput[];
  textSource: 'generated' | 'lesson' | 'custom';
  exerciseId?: string;
  clientWpm?: number;
  clientAccuracy?: number;
  practiceType?: string;
  practiceDifficulty?: number;
  focusKeys?: string[];
  certificateParagraphId?: string;
  certificateParagraphText?: string;
}

export interface ProcessedSession {
  session: any;
  result: any;
  newAchievements: any[];
  xpEarned: number;
  leveledUp: boolean;
  prevXP: number;
  newXP: number;
  level: number;
  prevLevel: number;
  levelTitle: string;
  xpBreakdown: { label: string; value: number }[];
  streak: any;
  isFirstActivityToday: boolean;
  isPersonalBest: boolean;
}

/**
 * Best WPM derived ONLY from typing Test and Certificate results, both of which
 * are stored as TypingResult rows with `mode === 'test'` (a certificate run is a
 * timed test flagged ?cert=1 on the client). Practice, Learn and game sessions
 * are excluded. Returns the highest test-mode WPM, or `null` when the user has
 * no test/certificate results at all.
 */
export async function getTestBestWpm(userId: Types.ObjectId | string): Promise<number | null> {
  const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  const [row] = await TypingResult.aggregate<{ bestWpm: number }>([
    { $match: { userId: userIdObj, mode: 'test' } },
    { $group: { _id: null, bestWpm: { $max: '$wpm' } } },
  ]);
  return row?.bestWpm ?? null;
}

export interface ProfileProgressStats {
  totalSessions: number;
  bestWpm: number | null;
  avgWpm: number;
  avgAccuracy: number;
  totalMinutesPracticed: number;
  learnLevel: number;
  completedLessons: number;
  totalLessons: number;
}

/**
 * Current Learn level for a user: the FIRST lesson (by order) that is unlocked
 * and not yet completed. Order 1 is always unlocked; any later lesson is only
 * unlocked once the previous lesson is completed. When every lesson is done,
 * the current level is the last one. This is the exact same "current level"
 * the Learn page shows (its "Recommended Next Lesson" hero card).
 */
export function deriveCurrentLearnLevel(
  lessons: { _id: unknown; order: number }[],
  completedLessonIds: string[]
): number {
  if (lessons.length === 0) return 1;
  const completed = new Set(completedLessonIds.map((id) => id.toString()));
  for (let i = 0; i < lessons.length; i++) {
    const previousDone = i === 0 || completed.has(String(lessons[i - 1]!._id));
    if (previousDone && !completed.has(String(lessons[i]!._id))) {
      return lessons[i]!.order;
    }
  }
  return lessons[lessons.length - 1]!.order;
}

/**
 * Live profile statistics derived directly from stored records every time they
 * are requested — the database is the source of truth, so the profile always
 * reflects the latest activity even when a user has no UserProgress document.
 *
 *  - totalSessions     completed Test + Practice + Game sessions (TypingResult
 *                      rows; a certificate run is a Test, and each game is one
 *                      TypingResult row, so no double counting) plus completed
 *                      Learn exercises (each passed exercise is one learn
 *                      session).
 *  - bestWpm           highest Test/Certificate WPM only (see getTestBestWpm).
 *  - avgAccuracy       overall (total correct / total typed) × 100. Test,
 *                      Practice and Game use the stored word-level
 *                      correct/attempted aggregates; Learn uses each completed
 *                      exercise's content word count as the typed basis with
 *                      its stored best accuracy, so nothing is invented.
 *  - learnLevel        the lesson currently unlocked but not yet completed
 *                      (the same "current level" the Learn page shows).
 */
export async function getProfileStats(userId: Types.ObjectId | string): Promise<ProfileProgressStats> {
  const uid = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

  const [lessons, lessonProgressDocs, typingTotals, sessionDurations, bestWpm] = await Promise.all([
    Lesson.find({ isActive: true }).sort({ order: 1 }),
    LessonProgress.find({ userId: uid }),
    TypingResult.aggregate<{ sessions: number; wpmSum: number; correctWords: number; attemptedWords: number }>([
      { $match: { userId: uid, mode: { $in: ['test', 'practice', 'game'] } } },
      { $group: { _id: null, sessions: { $sum: 1 }, wpmSum: { $sum: '$wpm' }, correctWords: { $sum: '$correctWords' }, attemptedWords: { $sum: '$attemptedWords' } } },
    ]),
    TypingSession.aggregate<{ seconds: number }>([
      { $match: { userId: uid } },
      { $group: { _id: null, seconds: { $sum: '$durationSeconds' } } },
    ]),
    getTestBestWpm(uid),
  ]);

  // Learn contribution: only completed (passed) exercises. Each one was fully
  // typed, so its content word count is the typed basis, and its stored best
  // accuracy gives the correct words. No new stored fields are introduced.
  const completedExerciseIds = Array.from(
    new Set(lessonProgressDocs.flatMap((doc) => doc.completedExerciseIds.map((id) => id.toString())))
  );
  const exerciseDocs = completedExerciseIds.length
    ? await Exercise.find({ _id: { $in: completedExerciseIds } }).select('content')
    : [];
  const wordCountByExercise = new Map(
    exerciseDocs.map((ex) => [ex._id.toString(), ex.content.trim().split(/\s+/).length])
  );

  let learnCorrectWords = 0;
  let learnTypedWords = 0;
  let learnSessions = 0;
  for (const doc of lessonProgressDocs) {
    for (const exId of doc.completedExerciseIds) {
      const key = exId.toString();
      const attempt = doc.exercises.find((item) => item.exerciseId.toString() === key);
      const accuracy = attempt?.bestAccuracy ?? doc.bestAccuracy;
      const typed = wordCountByExercise.get(key) ?? 0;
      if (typed === 0) continue;
      learnTypedWords += typed;
      learnCorrectWords += (typed * accuracy) / 100;
      learnSessions += 1;
    }
  }

  const completedLessons = lessonProgressDocs.filter((doc) => doc.completedAt).length;
  const totalLessons = lessons.length;

  // Current Learn level: first unlocked && not completed lesson by order.
  // Mirrors the Learn page "hero" logic (order 1 always unlocked; otherwise the
  // previous lesson must be completed). When every lesson is done, the level is
  // the last one.
  const completedLessonIds = lessonProgressDocs
    .filter((doc) => doc.completedAt)
    .map((doc) => doc.lessonId.toString());
  const learnLevel = deriveCurrentLearnLevel(lessons, completedLessonIds);

  const typing = typingTotals[0];
  const typedSessions = typing?.sessions ?? 0;
  const totalCorrect = (typing?.correctWords ?? 0) + learnCorrectWords;
  const totalTyped = (typing?.attemptedWords ?? 0) + learnTypedWords;
  const avgAccuracy = totalTyped > 0 ? Math.round((totalCorrect / totalTyped) * 1000) / 10 : 0;
  const avgWpm = typedSessions > 0 ? Math.round((typing!.wpmSum ?? 0) / typedSessions) : 0;
  const learnSeconds = lessonProgressDocs.reduce((sum, doc) => sum + doc.timeSpentSeconds, 0);
  const totalMinutesPracticed = (sessionDurations[0]?.seconds ?? 0) + learnSeconds > 0
    ? Math.round(((sessionDurations[0]?.seconds ?? 0) + learnSeconds) / 60)
    : 0;

  return {
    totalSessions: typedSessions + learnSessions,
    bestWpm,
    avgWpm,
    avgAccuracy,
    totalMinutesPracticed,
    learnLevel,
    completedLessons,
    totalLessons,
  };
}

/**
 * Single source of truth for a verified typing session.
 * All stats are computed server-side - client values are never trusted.
 * Used by both the typing and games submission flows.
 * Only called for authenticated users - guest activity is never stored.
 */
export async function processVerifiedTypingSession(
  userId: Types.ObjectId | string,
  input: SessionInput,
  startTime: Date,
  endTime: Date
): Promise<ProcessedSession> {
  const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
  if (durationSeconds <= 0) {
    throw Object.assign(new Error('Invalid session duration'), { statusCode: 400 });
  }

  const stats = computeStats(input.typedWords, durationSeconds);

  const session = await TypingSession.create({
    userId,
    mode: input.mode,
    startTime,
    endTime,
    durationSeconds,
    typedWords: input.typedWords,
    textSource: input.textSource,
    exerciseId: input.exerciseId,
    clientWpm: input.clientWpm,
    clientAccuracy: input.clientAccuracy,
    certificateParagraphId: input.certificateParagraphId,
    certificateParagraphText: input.certificateParagraphText,
  });

  const result = await TypingResult.create({
    sessionId: session._id,
    userId,
    wpm: stats.wpm,
    accuracy: stats.accuracy,
    correctWords: stats.correctWords,
    attemptedWords: stats.attemptedWords,
    errorsCount: stats.errorsCount,
    mode: input.mode,
    certificateParagraphId: input.certificateParagraphId,
    certificateParagraphText: input.certificateParagraphText,
  });

  if (input.mode === 'practice') {
    await PracticeSession.create({
      userId,
      sessionId: session._id,
      wordList: input.typedWords.map((word) => word.word),
      focusKeys: input.focusKeys ?? [],
      difficulty: input.practiceDifficulty ?? 1,
      exerciseType: input.practiceType ?? 'custom',
      durationSeconds,
      accuracy: stats.accuracy,
      wpm: stats.wpm,
      mistakes: stats.errorsCount,
    });
  }

  // Update UserProgress
  const progress = await UserProgress.findOne({ userId });
  const isPersonalBest = progress ? stats.wpm > progress.bestWpm : true;

  if (progress) {
    const prevTotal = progress.totalSessions;
    const prevAvgWpm = progress.avgWpm;
    const prevAvgAccuracy = progress.avgAccuracy;

    progress.totalSessions += 1;
    progress.bestWpm = Math.max(progress.bestWpm, stats.wpm);
    progress.avgWpm = Math.round(
      (prevAvgWpm * prevTotal + stats.wpm) / progress.totalSessions
    );
    progress.avgAccuracy = Math.round(
      ((prevAvgAccuracy * prevTotal + stats.accuracy) / progress.totalSessions) * 10
    ) / 10;
    progress.totalMinutesPracticed += durationSeconds / 60;
    await progress.save();
  }

  // First qualifying activity on this calendar day (drives streak + daily XP)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const streakDoc = await Streak.findOne({ userId });
  const isFirstActivityToday = !streakDoc?.lastActiveDate || !isSameDay(streakDoc.lastActiveDate, today);

  const streak = await updateStreak(userId);

  // Update weak keys
  const weakKeyMap = computeWeakKeys(input.typedWords);
  const weakKeyOps = Array.from(weakKeyMap.entries()).map(([key, data]) =>
    WeakKey.findOneAndUpdate(
      { userId, key },
      {
        $inc: { errorCount: data.errors, totalAttempts: data.attempts },
        lastUpdated: new Date(),
        ...(data.errors > 0 ? { lastMistakeAt: new Date() } : {}),
      },
      { upsert: true, new: true }
    ).then(async (wk) => {
      if (wk) {
        wk.errorRate =
          wk.totalAttempts > 0
            ? Math.round((wk.errorCount / wk.totalAttempts) * 1000) / 10
            : 0;
        const qualifies = wk.totalAttempts >= WEAK_KEY_MIN_ATTEMPTS && wk.errorRate >= WEAK_KEY_MIN_ERROR_RATE;
        if (qualifies && !wk.isWeak) wk.qualifiedAt = new Date();
        wk.isWeak = qualifies;
        await wk.save();
      }
    })
  );
  await Promise.all(weakKeyOps);

  // Check achievements from stored data
  const newAchievements = await checkAndAwardAchievements(userId);

  // Server-derive XP for this verified session (never trust the client)
  const sessionAward = computeSessionXp({
    mode: input.mode,
    stats,
    isPersonalBest,
    isFirstActivityToday,
  });
  const achievementBonus = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
  const xpEarned = sessionAward.total + achievementBonus;

  const award = await awardXp(userId, xpEarned);

  return {
    session,
    result,
    newAchievements,
    xpEarned,
    leveledUp: award.leveledUp,
    prevXP: award.prevXP,
    newXP: award.newXP,
    level: award.newLevel,
    prevLevel: award.prevLevel,
    levelTitle: award.levelTitle,
    xpBreakdown: sessionAward.breakdown,
    streak,
    isFirstActivityToday,
    isPersonalBest,
  };
}