import { Types } from 'mongoose';
import TypingSession from '../models/TypingSession';
import TypingResult from '../models/TypingResult';
import UserProgress from '../models/UserProgress';
import WeakKey from '../models/WeakKey';
import Streak from '../models/Streak';
import PracticeSession from '../models/PracticeSession';
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