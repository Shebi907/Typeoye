import { Request, Response } from 'express';
import TypingResult from '../models/TypingResult';
import TypingSession from '../models/TypingSession';
import PracticeSession from '../models/PracticeSession';
import LessonProgress from '../models/LessonProgress';
import Lesson from '../models/Lesson';
import WeakKey from '../models/WeakKey';
import UserProgress from '../models/UserProgress';
import Streak from '../models/Streak';
import { getTestBestWpm } from '../services/session.service';
import { sendSuccess, sendError } from '../utils/response';

/** Daily average WPM over the last 30 days (shared by trend + progress).
 *  Scoped by course language so English and Urdu trends never mix. */
async function wpmTrend(
  userId: unknown,
  language: 'en' | 'ur' = 'en'
): Promise<{ date: string; value: number; max: number; count: number }[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const results = await TypingResult.aggregate([
    {
      $match: {
        userId,
        language,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        avgWpm: { $avg: '$wpm' },
        maxWpm: { $max: '$wpm' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return results.map((r) => ({
    date: r._id as string,
    value: Math.round(r.avgWpm as number),
    max: r.maxWpm as number,
    count: r.count as number,
  }));
}

export async function getWpmTrend(req: Request, res: Response): Promise<void> {
  try {
    const language: 'en' | 'ur' = req.query['language'] === 'ur' ? 'ur' : 'en';
    const trend = await wpmTrend(req.user!._id, language);
    sendSuccess(res, { trend });
  } catch (err) {
    console.error('getWpmTrend error:', err);
    sendError(res, 'Failed to fetch WPM trend', 500);
  }
}

export async function getAccuracyTrend(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const language: 'en' | 'ur' = req.query['language'] === 'ur' ? 'ur' : 'en';
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const results = await TypingResult.aggregate([
      {
        $match: {
          userId: user._id,
          language,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          avgAccuracy: { $avg: '$accuracy' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trend = results.map((r) => ({
      date: r._id as string,
      value: Math.round((r.avgAccuracy as number) * 10) / 10,
      count: r.count as number,
    }));

    sendSuccess(res, { trend });
  } catch (err) {
    console.error('getAccuracyTrend error:', err);
    sendError(res, 'Failed to fetch accuracy trend', 500);
  }
}

export async function getWeakKeys(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const weakKeys = await WeakKey.find({ userId: user._id, isWeak: true })
      .sort({ errorRate: -1 })
      .limit(10);
    sendSuccess(res, { weakKeys });
  } catch (err) {
    console.error('getWeakKeys error:', err);
    sendError(res, 'Failed to fetch weak keys', 500);
  }
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const [progress, streak] = await Promise.all([
      UserProgress.findOne({ userId: user._id }),
      Streak.findOne({ userId: user._id }),
    ]);
    sendSuccess(res, { progress, streak });
  } catch (err) {
    console.error('getSummary error:', err);
    sendError(res, 'Failed to fetch summary', 500);
  }
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!; const page = Math.max(1, Number(req.query['page']) || 1); const limit = Math.min(50, Math.max(1, Number(req.query['limit']) || 10));
    const match: Record<string, unknown> = { userId: user._id };
    if (req.query['type'] === 'test' || req.query['type'] === 'practice') match['mode'] = req.query['type'];
    const date: Record<string, Date> = {}; if (typeof req.query['from'] === 'string') date['$gte'] = new Date(req.query['from']); if (typeof req.query['to'] === 'string') { const end = new Date(req.query['to']); end.setHours(23, 59, 59, 999); date['$lte'] = end; } if (Object.keys(date).length) match['createdAt'] = date;
    const pipeline: any[] = [{ $match: match }, { $lookup: { from: 'typingresults', localField: '_id', foreignField: 'sessionId', as: 'result' } }, { $unwind: '$result' }, { $lookup: { from: 'practicesessions', localField: '_id', foreignField: 'sessionId', as: 'practice' } }, { $unwind: { path: '$practice', preserveNullAndEmptyArrays: true } }];
    if (typeof req.query['mode'] === 'string' && req.query['mode']) pipeline.push({ $match: { 'practice.exerciseType': req.query['mode'] } });
    const rows = await TypingSession.aggregate([...pipeline, { $sort: { createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: { _id: 1, type: '$mode', mode: { $ifNull: ['$practice.exerciseType', '$mode'] }, wpm: '$result.wpm', accuracy: '$result.accuracy', durationSeconds: 1, createdAt: 1, focusKeys: '$practice.focusKeys' } }]);
    const totalResult = await TypingSession.aggregate([...pipeline, { $count: 'total' }]);
    sendSuccess(res, { sessions: rows, page, pages: Math.ceil((totalResult[0]?.total ?? 0) / limit), total: totalResult[0]?.total ?? 0 });
  } catch (err) { console.error('getHistory error:', err); sendError(res, 'Failed to load history', 500); }
}

export async function getDashboardData(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!; const since = new Date(); since.setDate(since.getDate() - 30); const week = new Date(); week.setDate(week.getDate() - 7); const previousWeek = new Date(); previousWeek.setDate(previousWeek.getDate() - 14);
    const [progress, streak, wpmTrend, accuracyTrend, practiceDistribution, learning, weakKeys, recent, previous, testBestWpm] = await Promise.all([
      UserProgress.findOne({ userId: user._id }), Streak.findOne({ userId: user._id }),
      TypingResult.aggregate([{ $match: { userId: user._id, createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $avg: '$wpm' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      TypingResult.aggregate([{ $match: { userId: user._id, createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $avg: '$accuracy' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      PracticeSession.aggregate([{ $match: { userId: user._id, createdAt: { $gte: since } } }, { $group: { _id: '$exerciseType', value: { $sum: '$durationSeconds' } } }, { $sort: { value: -1 } }]),
      LessonProgress.aggregate([{ $match: { userId: user._id, completedAt: { $exists: true } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, value: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      WeakKey.find({ userId: user._id, isWeak: true }).sort({ errorRate: -1 }).limit(3),
      TypingResult.aggregate([{ $match: { userId: user._id, createdAt: { $gte: week } } }, { $group: { _id: null, wpm: { $avg: '$wpm' }, accuracy: { $avg: '$accuracy' }, count: { $sum: 1 } } }]),
      TypingResult.aggregate([{ $match: { userId: user._id, createdAt: { $gte: previousWeek, $lt: week } } }, { $group: { _id: null, wpm: { $avg: '$wpm' } } }]),
      getTestBestWpm(user._id),
    ]);
    const dashProgress = progress ? { ...progress.toObject(), bestWpm: testBestWpm } : progress;
    let completed = 0; const learningTrend = learning.map((item) => ({ date: item._id, value: completed += item.value }));
    const currentWpm = recent[0]?.wpm; const oldWpm = previous[0]?.wpm; const improvement = currentWpm && oldWpm ? Math.round(((currentWpm - oldWpm) / oldWpm) * 100) : null;
    const recommendations: string[] = []; if (improvement !== null) recommendations.push(`Your average speed is ${improvement >= 0 ? 'up' : 'down'} ${Math.abs(improvement)}% compared with last week.`); if (weakKeys[0]) recommendations.push(`You frequently miss ${weakKeys.map((key) => key.key.toUpperCase()).join(', ')}. Recommended: a 5-minute Weak Key Practice drill.`); if (recent[0] && recent[0].accuracy < 90) recommendations.push(`Your recent accuracy is ${Math.round(recent[0].accuracy)}%. Slow down briefly and prioritize clean words.`); if (!recommendations.length) recommendations.push('Complete a Test or Practice session to unlock personalized coaching.');
sendSuccess(res, { progress: dashProgress, streak, charts: { wpm: wpmTrend.map((item) => ({ date: item._id, value: Math.round(item.value), count: item.count })), accuracy: accuracyTrend.map((item) => ({ date: item._id, value: Math.round(item.value * 10) / 10, count: item.count })), practice: practiceDistribution.map((item) => ({ label: item._id, value: item.value })), learning: learningTrend }, coach: { recommendations, weakKeys: weakKeys.map((key) => ({ key: key.key, errorRate: key.errorRate })), recentSessions: recent[0]?.count ?? 0 } });
  } catch (err) { console.error('getDashboardData error:', err); sendError(res, 'Failed to load dashboard data', 500); }
}

/** Per-user progress summary for /progress: per-mode stats, learning totals,
 *  recent sessions per mode, and the 30-day WPM trend. Scoped to the requested
 *  course language so English (`/progress`) and Urdu (`/progress/urdu`) show
 *  completely independent data. */
export async function getProgress(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const language: 'en' | 'ur' = res.locals['language'] === 'ur' ? 'ur' : 'en';
    const uid = user._id;

    const [modeStats, learnRows, totalLessons, recentSessions, recentLessons, trend, streakDoc, typingTotals, activeDates] = await Promise.all([
      TypingResult.aggregate([
        { $match: { userId: uid, language, mode: { $in: ['test', 'practice'] } } },
        {
          $group: {
            _id: '$mode',
            count: { $sum: 1 },
            avgWpm: { $avg: '$wpm' },
            avgAccuracy: { $avg: '$accuracy' },
            bestWpm: { $max: '$wpm' },
          },
        },
      ]),
      // Lesson totals scoped to this course's lessons only (via a join on
      // Lesson.language) so English never counts Urdu levels and vice versa.
      LessonProgress.aggregate([
        { $match: { userId: uid } },
        {
          $lookup: {
            from: Lesson.collection.name,
            localField: 'lessonId',
            foreignField: '_id',
            as: 'lesson',
          },
        },
        { $unwind: '$lesson' },
        { $match: { 'lesson.language': language } },
        {
          $group: {
            _id: null,
            completedLessons: { $sum: { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] } },
            completedExercises: { $sum: { $size: '$completedExerciseIds' } },
            avgAccuracy: { $avg: '$bestAccuracy' },
            timeSpentSeconds: { $sum: '$timeSpentSeconds' },
          },
        },
      ]),
      Lesson.countDocuments({ isActive: true, language }),
      TypingSession.aggregate([
        { $match: { userId: uid, language, mode: { $in: ['test', 'practice'] } } },
        { $lookup: { from: 'typingresults', localField: '_id', foreignField: 'sessionId', as: 'result' } },
        { $unwind: '$result' },
        { $lookup: { from: 'practicesessions', localField: '_id', foreignField: 'sessionId', as: 'practice' } },
        { $unwind: { path: '$practice', preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        { $project: { _id: 1, type: '$mode', mode: { $ifNull: ['$practice.exerciseType', '$mode'] }, wpm: '$result.wpm', accuracy: '$result.accuracy', durationSeconds: 1, createdAt: 1 } },
      ]),
      LessonProgress.aggregate([
        { $match: { userId: uid, completedAt: { $exists: true } } },
        { $sort: { completedAt: -1 } },
        { $lookup: { from: 'lessons', localField: 'lessonId', foreignField: '_id', as: 'lesson' } },
        { $unwind: '$lesson' },
        { $match: { 'lesson.language': language } },
        { $limit: 10 },
      ]),
      wpmTrend(uid, language),
      Streak.findOne({ userId: uid }),
      TypingResult.aggregate([
        { $match: { userId: uid, language, mode: { $in: ['test', 'practice'] } } },
        {
          $group: {
            _id: null,
            avgAccuracy: { $avg: '$accuracy' },
            correctWords: { $sum: '$correctWords' },
            errorsCount: { $sum: '$errorsCount' },
          },
        },
      ]),
      // Language-scoped active days (TypingResult + completed lessons) so Urdu
      // can show its own streak without borrowing English activity.
      activeDaysAggregate(uid, language),
    ]);

    const modes: Record<string, { count: number; avgWpm: number; avgAccuracy: number; bestWpm: number }> = {
      test: { count: 0, avgWpm: 0, avgAccuracy: 0, bestWpm: 0 },
      practice: { count: 0, avgWpm: 0, avgAccuracy: 0, bestWpm: 0 },
    };
    for (const row of modeStats) {
      modes[row._id] = {
        count: row.count,
        avgWpm: Math.round(row.avgWpm),
        avgAccuracy: Math.round(row.avgAccuracy * 10) / 10,
        bestWpm: row.bestWpm,
      };
    }

    const learnRow = learnRows[0];
    const learn = learnRow
      ? {
          completedLessons: learnRow.completedLessons,
          totalLessons,
          completedExercises: learnRow.completedExercises,
          avgAccuracy: Math.round(learnRow.avgAccuracy * 10) / 10,
          timeSpentSeconds: learnRow.timeSpentSeconds,
        }
      : { completedLessons: 0, totalLessons, completedExercises: 0, avgAccuracy: 0, timeSpentSeconds: 0 };

    const recent: { test: Record<string, unknown>[]; practice: Record<string, unknown>[]; lesson: Record<string, unknown>[] } = {
      test: [],
      practice: [],
      lesson: recentLessons.map((item) => ({
        _id: item._id,
        lessonId: item.lessonId,
        title: item.lesson?.title ?? 'Lesson',
        bestAccuracy: item.bestAccuracy,
        attempts: item.attempts,
        timeSpentSeconds: item.timeSpentSeconds,
        completedAt: item.completedAt,
      })),
    };
    for (const row of recentSessions) {
      if (row.type === 'test' || row.type === 'practice') {
        recent[row.type as 'test' | 'practice'].push({
          _id: row._id,
          type: row.type,
          mode: row.mode,
          wpm: row.wpm,
          accuracy: row.accuracy,
          durationSeconds: row.durationSeconds,
          createdAt: row.createdAt,
        });
      }
    }

    const totalsRow = typingTotals[0];

    // Urdu streak is derived from Urdu activity only; English keeps using the
    // shared Streak document (unchanged behaviour).
    const scopedActive = new Set(activeDates.map((d) => d.date));
    const streak = language === 'en'
      ? {
          current: streakDoc?.currentStreak ?? 0,
          longest: streakDoc?.longestStreak ?? 0,
          lastActiveDate: streakDoc?.lastActiveDate ?? null,
          activeDates: (streakDoc?.streakHistory ?? []).map((h) => {
            const d = new Date(h.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }),
        }
      : buildScopedStreak(scopedActive);

    sendSuccess(res, {
      modes,
      learn,
      recent,
      trend,
      streak,
      totals: {
        avgAccuracy: totalsRow ? Math.round(totalsRow.avgAccuracy * 10) / 10 : 0,
        keystrokes: totalsRow ? totalsRow.correctWords + totalsRow.errorsCount : 0,
      },
    });
  } catch (err) {
    console.error('getProgress error:', err);
    sendError(res, 'Failed to load progress data', 500);
  }
}

/** Distinct local-date keys (YYYY-MM-DD) with activity for one course. */
async function activeDaysAggregate(
  userId: unknown,
  language: 'en' | 'ur'
): Promise<{ date: string }[]> {
  const [typingDays, lessonDays] = await Promise.all([
    TypingResult.aggregate<{ _id: string }>([
      { $match: { userId, language } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
    ]),
    LessonProgress.aggregate<{ _id: string }>([
      { $match: { userId, completedAt: { $exists: true } } },
      { $lookup: { from: Lesson.collection.name, localField: 'lessonId', foreignField: '_id', as: 'lesson' } },
      { $unwind: '$lesson' },
      { $match: { 'lesson.language': language } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } } } },
    ]),
  ]);
  const keys = new Set<string>([...typingDays, ...lessonDays].map((r) => r._id));
  return Array.from(keys).map((date) => ({ date }));
}

/** Current/longest streak from a set of active local-date keys. */
function buildScopedStreak(active: Set<string>): {
  current: number;
  longest: number;
  lastActiveDate: Date | null;
  activeDates: string[];
} {
  const dates = Array.from(active).sort();
  if (dates.length === 0) {
    return { current: 0, longest: 0, lastActiveDate: null, activeDates: [] };
  }
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dayMs = 86_400_000;

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(`${dates[i - 1]}T00:00:00`);
    const cur = new Date(`${dates[i]}T00:00:00`);
    if (Math.round((+cur - +prev) / dayMs) === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
  }

  // Current streak: consecutive days ending today or yesterday.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = key(today);
  const yesterdayKey = key(new Date(+today - dayMs));
  let current = 0;
  if (active.has(todayKey) || active.has(yesterdayKey)) {
    let cursor = active.has(todayKey) ? today : new Date(+today - dayMs);
    while (active.has(key(cursor))) {
      current += 1;
      cursor = new Date(+cursor - dayMs);
    }
  }

  const lastActiveDate = new Date(`${dates[dates.length - 1]}T00:00:00`);
  return { current, longest, lastActiveDate, activeDates: dates };
}