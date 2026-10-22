import Achievement, {
  AchievementParams,
  IAchievement,
} from '../models/Achievement';
import UserAchievement from '../models/UserAchievement';
import TypingResult from '../models/TypingResult';
import TypingSession from '../models/TypingSession';
import PracticeSession from '../models/PracticeSession';
import LessonProgress from '../models/LessonProgress';
import Lesson from '../models/Lesson';
import type { LessonLanguage } from '../models/Lesson';
import Streak from '../models/Streak';
import UserProgress from '../models/UserProgress';
import mongoose from 'mongoose';

interface TestSnapshot {
  wpm: number;
  accuracy: number;
  durationSeconds: number;
}

export interface AchievementContext {
  testCount: number;
  practiceCount: number;
  bestWpm: number;
  bestTestAccuracy: number;
  currentStreak: number;
  /** Completed ENGLISH lessons (>=90% accuracy) — drives the existing "lessons" rules. */
  lessonCount: number;
  /** Completed URDU lessons (>=90% accuracy) — tracked fully independently. */
  urduLessonCount: number;
  /** Completed lessons in THIS context's language (>=90% accuracy). */
  languageLessonCount: number;
  /** Test/practice counts scoped to THIS context's language. */
  languageTestCount: number;
  languagePracticeCount: number;
  languageBestWpm: number;
  languageBestTestAccuracy: number;
  languageTests: TestSnapshot[];
  /** English test snapshots (drives the original wpm/accuracy rules). */
  tests: TestSnapshot[];
}

/**
 * All achievement conditions are derived from real, stored session data.
 * Nothing here comes from the client.
 *
 * Durations come from the matching TypingSession so that tests completed
 * before per-test durations existed still qualify for time-based rules.
 */
async function buildContext(
  userId: mongoose.Types.ObjectId | string,
  language: LessonLanguage = 'en'
): Promise<AchievementContext> {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const [
    testCount,
    practiceCount,
    streak,
    progress,
    lessonCounts,
    bestTestAccuracy,
    tests,
    languageTestCount,
    languagePracticeCount,
    languageBestWpmRow,
    languageBestAccuracyRow,
    languageTests,
  ] = await Promise.all([
      TypingResult.countDocuments({ userId, mode: 'test' }),
      PracticeSession.countDocuments({ userId }),
      Streak.findOne({ userId }),
      UserProgress.findOne({ userId }),
      // Completed lessons split by course language so English and Urdu progress
      // never bleed into each other's achievements.
      LessonProgress.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            userId: uid,
            completedAt: { $exists: true },
            bestAccuracy: { $gte: 90 },
          },
        },
        {
          $lookup: {
            from: Lesson.collection.name,
            localField: 'lessonId',
            foreignField: '_id',
            as: 'lesson',
          },
        },
        { $unwind: '$lesson' },
        { $group: { _id: '$lesson.language', count: { $sum: 1 } } },
      ]),
      TypingResult.aggregate([
        { $match: { userId, mode: 'test' } },
        { $group: { _id: null, max: { $max: '$accuracy' } } },
      ]),
      TypingResult.aggregate([
        { $match: { userId, mode: 'test' } },
        {
          $lookup: {
            from: TypingSession.collection.name,
            localField: 'sessionId',
            foreignField: '_id',
            as: 'session',
          },
        },
        {
          $project: {
            wpm: 1,
            accuracy: 1,
            durationSeconds: {
              $ifNull: [{ $arrayElemAt: ['$session.durationSeconds', 0] }, 0],
            },
          },
        },
      ]),
      // Language-scoped test/practice counts (used by Urdu achievements).
      TypingResult.countDocuments({ userId, mode: 'test', language: language === 'ur' ? 'ur' : 'en' }),
      PracticeSession.countDocuments({ userId, language: language === 'ur' ? 'ur' : 'en' }),
      TypingResult.aggregate([
        { $match: { userId, mode: 'test', language: language === 'ur' ? 'ur' : 'en' } },
        { $group: { _id: null, max: { $max: '$wpm' } } },
      ]),
      TypingResult.aggregate([
        { $match: { userId, mode: 'test', language: language === 'ur' ? 'ur' : 'en' } },
        { $group: { _id: null, max: { $max: '$accuracy' } } },
      ]),
      TypingResult.aggregate([
        { $match: { userId, mode: 'test', language: language === 'ur' ? 'ur' : 'en' } },
        {
          $lookup: {
            from: TypingSession.collection.name,
            localField: 'sessionId',
            foreignField: '_id',
            as: 'session',
          },
        },
        {
          $project: {
            wpm: 1,
            accuracy: 1,
            durationSeconds: {
              $ifNull: [{ $arrayElemAt: ['$session.durationSeconds', 0] }, 0],
            },
          },
        },
      ]),
    ]);
  const countByLanguage = new Map(lessonCounts.map((row) => [row._id, row.count]));
  const lessonCount = countByLanguage.get('en') ?? 0;
  const urduLessonCount = countByLanguage.get('ur') ?? 0;
  return {
    testCount,
    practiceCount,
    bestWpm: progress?.bestWpm ?? 0,
    bestTestAccuracy: bestTestAccuracy[0]?.max ?? 0,
    currentStreak: streak?.currentStreak ?? 0,
    lessonCount,
    urduLessonCount,
    languageLessonCount: language === 'ur' ? urduLessonCount : lessonCount,
    languageTestCount,
    languagePracticeCount,
    languageBestWpm: languageBestWpmRow[0]?.max ?? 0,
    languageBestTestAccuracy: languageBestAccuracyRow[0]?.max ?? 0,
    languageTests,
    tests,
  };
}

function testMeets(
  t: TestSnapshot,
  opts: { minWpm?: number; minAccuracy?: number; minDuration?: number }
): boolean {
  return (
    t.wpm >= (opts.minWpm ?? 0) &&
    t.accuracy >= (opts.minAccuracy ?? 0) &&
    (t.durationSeconds ?? 0) >= (opts.minDuration ?? 0)
  );
}

function qualifies(
  type: string,
  threshold: number,
  params: AchievementParams | undefined,
  ctx: AchievementContext
): boolean {
  switch (type) {
    case 'first_test':
      return ctx.testCount >= threshold;
    case 'first_practice':
    case 'practice':
      return ctx.practiceCount >= threshold;
    case 'wpm': {
      const base = { minAccuracy: params?.minAccuracy, minDuration: params?.minDuration };
      const count = ctx.tests.filter((t) => testMeets(t, base) && t.wpm >= threshold).length;
      return (params?.requiredTests ?? 1) <= count;
    }
    case 'accuracy': {
      const base = { minWpm: params?.minWpm, minDuration: params?.minDuration };
      const count = ctx.tests.filter((t) => testMeets(t, base) && t.accuracy >= threshold).length;
      return (params?.requiredTests ?? 1) <= count;
    }
    case 'streak':
      return ctx.currentStreak >= threshold;
    case 'lessons':
    case 'lesson':
      return ctx.lessonCount >= threshold;
    case 'urdu_lessons':
    case 'urdu_lesson':
      return ctx.urduLessonCount >= threshold;
    case 'urdu_tests':
    case 'urdu_test':
      return ctx.languageTestCount >= threshold;
    case 'urdu_practice':
      return ctx.languagePracticeCount >= threshold;
    case 'urdu_wpm': {
      const base = { minAccuracy: params?.minAccuracy, minDuration: params?.minDuration };
      const count = ctx.languageTests.filter((t) => testMeets(t, base) && t.wpm >= threshold).length;
      return (params?.requiredTests ?? 1) <= count;
    }
    case 'urdu_accuracy': {
      const base = { minWpm: params?.minWpm, minDuration: params?.minDuration };
      const count = ctx.languageTests.filter((t) => testMeets(t, base) && t.accuracy >= threshold).length;
      return (params?.requiredTests ?? 1) <= count;
    }
    default:
      return false;
  }
}

function currentValue(
  type: string,
  threshold: number,
  params: AchievementParams | undefined,
  ctx: AchievementContext
): number {
  switch (type) {
    case 'first_test':
      return ctx.testCount;
    case 'first_practice':
    case 'practice':
      return ctx.practiceCount;
    case 'wpm': {
      if (params?.minAccuracy || params?.minDuration) {
        const base = { minAccuracy: params?.minAccuracy, minDuration: params?.minDuration };
        return Math.max(0, ...ctx.tests.filter((t) => testMeets(t, base)).map((t) => t.wpm));
      }
      return ctx.bestWpm;
    }
    case 'accuracy': {
      if (params?.minWpm || params?.minDuration) {
        const base = { minWpm: params?.minWpm, minDuration: params?.minDuration };
        return Math.max(0, ...ctx.tests.filter((t) => testMeets(t, base)).map((t) => t.accuracy));
      }
      return ctx.bestTestAccuracy;
    }
    case 'streak':
      return ctx.currentStreak;
    case 'lessons':
    case 'lesson':
      return ctx.lessonCount;
    case 'urdu_lessons':
    case 'urdu_lesson':
      return ctx.urduLessonCount;
    case 'urdu_tests':
    case 'urdu_test':
      return ctx.languageTestCount;
    case 'urdu_practice':
      return ctx.languagePracticeCount;
    case 'urdu_wpm': {
      if (params?.minAccuracy || params?.minDuration) {
        const base = { minAccuracy: params?.minAccuracy, minDuration: params?.minDuration };
        return Math.max(0, ...ctx.languageTests.filter((t) => testMeets(t, base)).map((t) => t.wpm));
      }
      return ctx.languageBestWpm;
    }
    case 'urdu_accuracy': {
      if (params?.minWpm || params?.minDuration) {
        const base = { minWpm: params?.minWpm, minDuration: params?.minDuration };
        return Math.max(0, ...ctx.languageTests.filter((t) => testMeets(t, base)).map((t) => t.accuracy));
      }
      return ctx.languageBestTestAccuracy;
    }
    default:
      return 0;
  }
}

export interface AchievementStatus {
  _id: unknown;
  name: string;
  description: string;
  icon: string;
  condition: { type: string; threshold: number };
  params?: AchievementParams;
  xpReward: number;
  rarity: string;
  unlocked: boolean;
  unlockedAt: Date | null;
  current: number;
  progress: number;
}

export async function checkAndAwardAchievements(
  userId: mongoose.Types.ObjectId | string,
  language: LessonLanguage = 'en'
): Promise<IAchievement[]> {
  const lang = language === 'ur' ? 'ur' : 'en';
  const [allAchievements, existing] = await Promise.all([
    Achievement.find({ isActive: true, language: lang }),
    UserAchievement.find({ userId }).select('achievementId'),
  ]);

  const unlockedIds = new Set(existing.map((ua) => ua.achievementId.toString()));
  // Context is built for the language whose achievements are being checked, so
  // English rules read English data and Urdu rules read Urdu data. English
  // achievements use `lessons`/`wpm`/... against English counts; Urdu ones use
  // `urdu_*` rule types against the same Urdu-scoped context.
  const ctx = await buildContext(userId, lang);
  const newlyUnlocked: IAchievement[] = [];

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement._id.toString())) continue;
    if (!qualifies(achievement.condition.type, achievement.condition.threshold, achievement.params, ctx)) continue;

    await UserAchievement.create({
      userId,
      achievementId: achievement._id,
      unlockedAt: new Date(),
      progress: achievement.condition.threshold,
      isNewlyEarned: true,
    });
    newlyUnlocked.push(achievement);
  }

  return newlyUnlocked;
}

/**
 * Full achievement inventory with server-computed unlock status and
 * progress, used by the Dashboard achievements tab. Returns a flat list
 * of achievements where `progress` is the user's raw current value and
 * `unlocked` reflects a real, stored unlock.
 */
export async function getAchievementsForUser(
  userId: mongoose.Types.ObjectId | string,
  language: LessonLanguage = 'en'
): Promise<AchievementStatus[]> {
  const lang = language === 'ur' ? 'ur' : 'en';
  const [all, userAchievements] = await Promise.all([
    Achievement.find({ isActive: true, language: lang }).sort({ xpReward: 1, name: 1 }),
    UserAchievement.find({ userId }),
  ]);

  const ctx = await buildContext(userId, lang);
  const unlockedMap = new Map(
    userAchievements.map((ua) => [ua.achievementId.toString(), ua])
  );

  return all.map((achievement) => {
    const doc = unlockedMap.get(achievement._id.toString());
    const current = currentValue(
      achievement.condition.type,
      achievement.condition.threshold,
      achievement.params,
      ctx
    );
    return {
      ...achievement.toObject(),
      unlocked: Boolean(doc),
      unlockedAt: doc?.unlockedAt ?? null,
      current,
      progress: current,
    };
  });
}

export const getUserAchievements = getAchievementsForUser;