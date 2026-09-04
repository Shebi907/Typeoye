"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWpmTrend = getWpmTrend;
exports.getAccuracyTrend = getAccuracyTrend;
exports.getWeakKeys = getWeakKeys;
exports.getSummary = getSummary;
exports.getHistory = getHistory;
exports.getDashboardData = getDashboardData;
exports.getProgress = getProgress;
const TypingResult_1 = __importDefault(require("../models/TypingResult"));
const TypingSession_1 = __importDefault(require("../models/TypingSession"));
const PracticeSession_1 = __importDefault(require("../models/PracticeSession"));
const LessonProgress_1 = __importDefault(require("../models/LessonProgress"));
const Lesson_1 = __importDefault(require("../models/Lesson"));
const WeakKey_1 = __importDefault(require("../models/WeakKey"));
const UserProgress_1 = __importDefault(require("../models/UserProgress"));
const Streak_1 = __importDefault(require("../models/Streak"));
const session_service_1 = require("../services/session.service");
const response_1 = require("../utils/response");
/** Daily average WPM over the last 30 days (shared by trend + progress). */
async function wpmTrend(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const results = await TypingResult_1.default.aggregate([
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
        date: r._id,
        value: Math.round(r.avgWpm),
        max: r.maxWpm,
        count: r.count,
    }));
}
async function getWpmTrend(req, res) {
    try {
        const trend = await wpmTrend(req.user._id);
        (0, response_1.sendSuccess)(res, { trend });
    }
    catch (err) {
        console.error('getWpmTrend error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch WPM trend', 500);
    }
}
async function getAccuracyTrend(req, res) {
    try {
        const user = req.user;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const results = await TypingResult_1.default.aggregate([
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
            date: r._id,
            value: Math.round(r.avgAccuracy * 10) / 10,
            count: r.count,
        }));
        (0, response_1.sendSuccess)(res, { trend });
    }
    catch (err) {
        console.error('getAccuracyTrend error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch accuracy trend', 500);
    }
}
async function getWeakKeys(req, res) {
    try {
        const user = req.user;
        const weakKeys = await WeakKey_1.default.find({ userId: user._id, isWeak: true })
            .sort({ errorRate: -1 })
            .limit(10);
        (0, response_1.sendSuccess)(res, { weakKeys });
    }
    catch (err) {
        console.error('getWeakKeys error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch weak keys', 500);
    }
}
async function getSummary(req, res) {
    try {
        const user = req.user;
        const [progress, streak] = await Promise.all([
            UserProgress_1.default.findOne({ userId: user._id }),
            Streak_1.default.findOne({ userId: user._id }),
        ]);
        (0, response_1.sendSuccess)(res, { progress, streak });
    }
    catch (err) {
        console.error('getSummary error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch summary', 500);
    }
}
async function getHistory(req, res) {
    try {
        const user = req.user;
        const page = Math.max(1, Number(req.query['page']) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query['limit']) || 10));
        const match = { userId: user._id };
        if (req.query['type'] === 'test' || req.query['type'] === 'practice')
            match['mode'] = req.query['type'];
        const date = {};
        if (typeof req.query['from'] === 'string')
            date['$gte'] = new Date(req.query['from']);
        if (typeof req.query['to'] === 'string') {
            const end = new Date(req.query['to']);
            end.setHours(23, 59, 59, 999);
            date['$lte'] = end;
        }
        if (Object.keys(date).length)
            match['createdAt'] = date;
        const pipeline = [{ $match: match }, { $lookup: { from: 'typingresults', localField: '_id', foreignField: 'sessionId', as: 'result' } }, { $unwind: '$result' }, { $lookup: { from: 'practicesessions', localField: '_id', foreignField: 'sessionId', as: 'practice' } }, { $unwind: { path: '$practice', preserveNullAndEmptyArrays: true } }];
        if (typeof req.query['mode'] === 'string' && req.query['mode'])
            pipeline.push({ $match: { 'practice.exerciseType': req.query['mode'] } });
        const rows = await TypingSession_1.default.aggregate([...pipeline, { $sort: { createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: { _id: 1, type: '$mode', mode: { $ifNull: ['$practice.exerciseType', '$mode'] }, wpm: '$result.wpm', accuracy: '$result.accuracy', durationSeconds: 1, createdAt: 1, focusKeys: '$practice.focusKeys' } }]);
        const totalResult = await TypingSession_1.default.aggregate([...pipeline, { $count: 'total' }]);
        (0, response_1.sendSuccess)(res, { sessions: rows, page, pages: Math.ceil((totalResult[0]?.total ?? 0) / limit), total: totalResult[0]?.total ?? 0 });
    }
    catch (err) {
        console.error('getHistory error:', err);
        (0, response_1.sendError)(res, 'Failed to load history', 500);
    }
}
async function getDashboardData(req, res) {
    try {
        const user = req.user;
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const week = new Date();
        week.setDate(week.getDate() - 7);
        const previousWeek = new Date();
        previousWeek.setDate(previousWeek.getDate() - 14);
        const [progress, streak, wpmTrend, accuracyTrend, practiceDistribution, learning, weakKeys, recent, previous, testBestWpm] = await Promise.all([
            UserProgress_1.default.findOne({ userId: user._id }), Streak_1.default.findOne({ userId: user._id }),
            TypingResult_1.default.aggregate([{ $match: { userId: user._id, createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $avg: '$wpm' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
            TypingResult_1.default.aggregate([{ $match: { userId: user._id, createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $avg: '$accuracy' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
            PracticeSession_1.default.aggregate([{ $match: { userId: user._id, createdAt: { $gte: since } } }, { $group: { _id: '$exerciseType', value: { $sum: '$durationSeconds' } } }, { $sort: { value: -1 } }]),
            LessonProgress_1.default.aggregate([{ $match: { userId: user._id, completedAt: { $exists: true } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, value: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
            WeakKey_1.default.find({ userId: user._id, isWeak: true }).sort({ errorRate: -1 }).limit(3),
            TypingResult_1.default.aggregate([{ $match: { userId: user._id, createdAt: { $gte: week } } }, { $group: { _id: null, wpm: { $avg: '$wpm' }, accuracy: { $avg: '$accuracy' }, count: { $sum: 1 } } }]),
            TypingResult_1.default.aggregate([{ $match: { userId: user._id, createdAt: { $gte: previousWeek, $lt: week } } }, { $group: { _id: null, wpm: { $avg: '$wpm' } } }]),
            (0, session_service_1.getTestBestWpm)(user._id),
        ]);
        const dashProgress = progress ? { ...progress.toObject(), bestWpm: testBestWpm } : progress;
        let completed = 0;
        const learningTrend = learning.map((item) => ({ date: item._id, value: completed += item.value }));
        const currentWpm = recent[0]?.wpm;
        const oldWpm = previous[0]?.wpm;
        const improvement = currentWpm && oldWpm ? Math.round(((currentWpm - oldWpm) / oldWpm) * 100) : null;
        const recommendations = [];
        if (improvement !== null)
            recommendations.push(`Your average speed is ${improvement >= 0 ? 'up' : 'down'} ${Math.abs(improvement)}% compared with last week.`);
        if (weakKeys[0])
            recommendations.push(`You frequently miss ${weakKeys.map((key) => key.key.toUpperCase()).join(', ')}. Recommended: a 5-minute Weak Key Practice drill.`);
        if (recent[0] && recent[0].accuracy < 90)
            recommendations.push(`Your recent accuracy is ${Math.round(recent[0].accuracy)}%. Slow down briefly and prioritize clean words.`);
        if (!recommendations.length)
            recommendations.push('Complete a Test or Practice session to unlock personalized coaching.');
        (0, response_1.sendSuccess)(res, { progress: dashProgress, streak, charts: { wpm: wpmTrend.map((item) => ({ date: item._id, value: Math.round(item.value), count: item.count })), accuracy: accuracyTrend.map((item) => ({ date: item._id, value: Math.round(item.value * 10) / 10, count: item.count })), practice: practiceDistribution.map((item) => ({ label: item._id, value: item.value })), learning: learningTrend }, coach: { recommendations, weakKeys: weakKeys.map((key) => ({ key: key.key, errorRate: key.errorRate })), recentSessions: recent[0]?.count ?? 0 } });
    }
    catch (err) {
        console.error('getDashboardData error:', err);
        (0, response_1.sendError)(res, 'Failed to load dashboard data', 500);
    }
}
/** Per-user progress summary for /progress: per-mode stats, learning totals,
 *  recent sessions per mode, and the 30-day WPM trend. */
async function getProgress(req, res) {
    try {
        const user = req.user;
        const [modeStats, learnRows, totalLessons, recentSessions, recentLessons, trend, streakDoc, typingTotals] = await Promise.all([
            TypingResult_1.default.aggregate([
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
            LessonProgress_1.default.aggregate([
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
            Lesson_1.default.countDocuments({ isActive: true }),
            TypingSession_1.default.aggregate([
                { $match: { userId: user._id, mode: { $in: ['test', 'practice'] } } },
                { $lookup: { from: 'typingresults', localField: '_id', foreignField: 'sessionId', as: 'result' } },
                { $unwind: '$result' },
                { $lookup: { from: 'practicesessions', localField: '_id', foreignField: 'sessionId', as: 'practice' } },
                { $unwind: { path: '$practice', preserveNullAndEmptyArrays: true } },
                { $sort: { createdAt: -1 } },
                { $limit: 20 },
                { $project: { _id: 1, type: '$mode', mode: { $ifNull: ['$practice.exerciseType', '$mode'] }, wpm: '$result.wpm', accuracy: '$result.accuracy', durationSeconds: 1, createdAt: 1 } },
            ]),
            LessonProgress_1.default.aggregate([
                { $match: { userId: user._id, completedAt: { $exists: true } } },
                { $sort: { completedAt: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'lessons', localField: 'lessonId', foreignField: '_id', as: 'lesson' } },
            ]),
            wpmTrend(user._id),
            Streak_1.default.findOne({ userId: user._id }),
            TypingResult_1.default.aggregate([
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
        const modes = {
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
        const recent = {
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
                recent[row.type].push({
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
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (err) {
        console.error('getProgress error:', err);
        (0, response_1.sendError)(res, 'Failed to load progress data', 500);
    }
}
//# sourceMappingURL=analytics.controller.js.map