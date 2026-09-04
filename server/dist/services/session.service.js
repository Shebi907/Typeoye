"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestBestWpm = getTestBestWpm;
exports.processVerifiedTypingSession = processVerifiedTypingSession;
const mongoose_1 = require("mongoose");
const TypingSession_1 = __importDefault(require("../models/TypingSession"));
const TypingResult_1 = __importDefault(require("../models/TypingResult"));
const UserProgress_1 = __importDefault(require("../models/UserProgress"));
const WeakKey_1 = __importDefault(require("../models/WeakKey"));
const Streak_1 = __importDefault(require("../models/Streak"));
const PracticeSession_1 = __importDefault(require("../models/PracticeSession"));
const wpm_service_1 = require("./wpm.service");
const streak_service_1 = require("./streak.service");
const achievement_service_1 = require("./achievement.service");
const gamification_service_1 = require("./gamification.service");
const WeakKey_2 = require("../models/WeakKey");
/**
 * Best WPM derived ONLY from typing Test and Certificate results, both of which
 * are stored as TypingResult rows with `mode === 'test'` (a certificate run is a
 * timed test flagged ?cert=1 on the client). Practice, Learn and game sessions
 * are excluded. Returns the highest test-mode WPM, or `null` when the user has
 * no test/certificate results at all.
 */
async function getTestBestWpm(userId) {
    const userIdObj = typeof userId === 'string' ? new mongoose_1.Types.ObjectId(userId) : userId;
    const [row] = await TypingResult_1.default.aggregate([
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
async function processVerifiedTypingSession(userId, input, startTime, endTime) {
    const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    if (durationSeconds <= 0) {
        throw Object.assign(new Error('Invalid session duration'), { statusCode: 400 });
    }
    const stats = (0, wpm_service_1.computeStats)(input.typedWords, durationSeconds);
    const session = await TypingSession_1.default.create({
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
    const result = await TypingResult_1.default.create({
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
        await PracticeSession_1.default.create({
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
    const progress = await UserProgress_1.default.findOne({ userId });
    const isPersonalBest = progress ? stats.wpm > progress.bestWpm : true;
    if (progress) {
        const prevTotal = progress.totalSessions;
        const prevAvgWpm = progress.avgWpm;
        const prevAvgAccuracy = progress.avgAccuracy;
        progress.totalSessions += 1;
        progress.bestWpm = Math.max(progress.bestWpm, stats.wpm);
        progress.avgWpm = Math.round((prevAvgWpm * prevTotal + stats.wpm) / progress.totalSessions);
        progress.avgAccuracy = Math.round(((prevAvgAccuracy * prevTotal + stats.accuracy) / progress.totalSessions) * 10) / 10;
        progress.totalMinutesPracticed += durationSeconds / 60;
        await progress.save();
    }
    // First qualifying activity on this calendar day (drives streak + daily XP)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const streakDoc = await Streak_1.default.findOne({ userId });
    const isFirstActivityToday = !streakDoc?.lastActiveDate || !(0, streak_service_1.isSameDay)(streakDoc.lastActiveDate, today);
    const streak = await (0, streak_service_1.updateStreak)(userId);
    // Update weak keys
    const weakKeyMap = (0, wpm_service_1.computeWeakKeys)(input.typedWords);
    const weakKeyOps = Array.from(weakKeyMap.entries()).map(([key, data]) => WeakKey_1.default.findOneAndUpdate({ userId, key }, {
        $inc: { errorCount: data.errors, totalAttempts: data.attempts },
        lastUpdated: new Date(),
        ...(data.errors > 0 ? { lastMistakeAt: new Date() } : {}),
    }, { upsert: true, new: true }).then(async (wk) => {
        if (wk) {
            wk.errorRate =
                wk.totalAttempts > 0
                    ? Math.round((wk.errorCount / wk.totalAttempts) * 1000) / 10
                    : 0;
            const qualifies = wk.totalAttempts >= WeakKey_2.WEAK_KEY_MIN_ATTEMPTS && wk.errorRate >= WeakKey_2.WEAK_KEY_MIN_ERROR_RATE;
            if (qualifies && !wk.isWeak)
                wk.qualifiedAt = new Date();
            wk.isWeak = qualifies;
            await wk.save();
        }
    }));
    await Promise.all(weakKeyOps);
    // Check achievements from stored data
    const newAchievements = await (0, achievement_service_1.checkAndAwardAchievements)(userId);
    // Server-derive XP for this verified session (never trust the client)
    const sessionAward = (0, gamification_service_1.computeSessionXp)({
        mode: input.mode,
        stats,
        isPersonalBest,
        isFirstActivityToday,
    });
    const achievementBonus = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
    const xpEarned = sessionAward.total + achievementBonus;
    const award = await (0, gamification_service_1.awardXp)(userId, xpEarned);
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
//# sourceMappingURL=session.service.js.map