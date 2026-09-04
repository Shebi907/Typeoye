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

/** Daily average WPM over the last 30 days (shared by trend + progress). */
async function wpmTrend(userId: unknown): Promise<{ date: string; value: number; max: number; count: number }[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const results = await TypingResult.aggregate([
    {
      $match: {
        userId,
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
    const trend = await wpmTrend(req.user!._id);
    sendSuccess(res, { trend });
  } catch (err) {
    console.error('getWpmTrend error:', err);
    sendError(res, 'Failed to fetch WPM trend', 500);
  }
}

export async function getAccuracyTrend(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const results = await TypingResult.aggregate([
      {
        $match: {
          userId: user._id,
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
 *  recent sessions per mode, and the 30-day WPM trend. */
export async function getProgress(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;

    const [modeStats, learnRows, totalLessons, recentSessions, recentLessons, trend, streakDoc, typingTotals] = await Promise.all([
      TypingResult.aggregate([
        { $match: { userId: user._id, mode: { $in: ['test', 'practice'] } } },
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
      LessonProgress.aggregate([
        { $match: { userId: user._id } },
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
      Lesson.countDocuments({ isActive: true }),
      TypingSession.aggregate([
        { $match: { userId: user._id, mode: { $in: ['test', 'practice'] } } },
        { $lookup: { from: 'typingresults', localField: '_id', foreignField: 'sessionId', as: 'result' } },
        { $unwind: '$result' },
        { $lookup: { from: 'practicesessions', localField: '_id', foreignField: 'sessionId', as: 'practice' } },
        { $unwind: { path: '$practice', preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        { $project: { _id: 1, type: '$mode', mode: { $ifNull: ['$practice.exerciseType', '$mode'] }, wpm: '$result.wpm', accuracy: '$result.accuracy', durationSeconds: 1, createdAt: 1 } },
      ]),
      LessonProgress.aggregate([
        { $match: { userId: user._id, completedAt: { $exists: true } } },
        { $sort: { completedAt: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'lessons', localField: 'lessonId', foreignField: '_id', as: 'lesson' } },
      ]),
      wpmTrend(user._id),
      Streak.findOne({ userId: user._id }),
      TypingResult.aggregate([
        { $match: { userId: user._id, mode: { $in: ['test', 'practice'] } } },
        {
          $group: {
            _id: null,
            avgAccuracy: { $avg: '$accuracy' },
            correctWords: { $sum: '$correctWords' },
            errorsCount: { $sum: '$errorsCount' },
          },
        },
      ]),
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
        title: item.lesson?.[0]?.title ?? 'Lesson',
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

    sendSuccess(res, {
      modes,
      learn,
      recent,
      trend,
      streak: {
        current: streakDoc?.currentStreak ?? 0,
        longest: streakDoc?.longestStreak ?? 0,
        lastActiveDate: streakDoc?.lastActiveDate ?? null,
        activeDates: (streakDoc?.streakHistory ?? []).map((h) => {
          const d = new Date(h.date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }),
      },
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