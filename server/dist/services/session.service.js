"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestBestWpm = getTestBestWpm;
exports.getProfileStats = getProfileStats;
exports.processVerifiedTypingSession = processVerifiedTypingSession;
const mongoose_1 = require("mongoose");
const TypingSession_1 = __importDefault(require("../models/TypingSession"));
const TypingResult_1 = __importDefault(require("../models/TypingResult"));
const UserProgress_1 = __importDefault(require("../models/UserProgress"));
const WeakKey_1 = __importDefault(require("../models/WeakKey"));
const Streak_1 = __importDefault(require("../models/Streak"));
const PracticeSession_1 = __importDefault(require("../models/PracticeSession"));
const Lesson_1 = __importDefault(require("../models/Lesson"));
const LessonProgress_1 = __importDefault(require("../models/LessonProgress"));
const Exercise_1 = __importDefault(require("../models/Exercise"));
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
async function getProfileStats(userId) {
    const uid = typeof userId === 'string' ? new mongoose_1.Types.ObjectId(userId) : userId;
    const [lessons, lessonProgressDocs, typingTotals, sessionDurations, bestWpm] = await Promise.all([
        Lesson_1.default.find({ isActive: true }).sort({ order: 1 }),
        LessonProgress_1.default.find({ userId: uid }),
        TypingResult_1.default.aggregate([
            { $match: { userId: uid, mode: { $in: ['test', 'practice', 'game'] } } },
            { $group: { _id: null, sessions: { $sum: 1 }, wpmSum: { $sum: '$wpm' }, correctWords: { $sum: '$correctWords' }, attemptedWords: { $sum: '$attemptedWords' } } },
        ]),
        TypingSession_1.default.aggregate([
            { $match: { userId: uid } },
            { $group: { _id: null, seconds: { $sum: '$durationSeconds' } } },
        ]),
        getTestBestWpm(uid),
    ]);
    // Learn contribution: only completed (passed) exercises. Each one was fully
    // typed, so its content word count is the typed basis, and its stored best
    // accuracy gives the correct words. No new stored fields are introduced.
    const completedExerciseIds = Array.from(new Set(lessonProgressDocs.flatMap((doc) => doc.completedExerciseIds.map((id) => id.toString()))));
    const exerciseDocs = completedExerciseIds.length
        ? await Exercise_1.default.find({ _id: { $in: completedExerciseIds } }).select('content')
        : [];
    const wordCountByExercise = new Map(exerciseDocs.map((ex) => [ex._id.toString(), ex.content.trim().split(/\s+/).length]));
    let learnCorrectWords = 0;
    let learnTypedWords = 0;
    let learnSessions = 0;
    for (const doc of lessonProgressDocs) {
        for (const exId of doc.completedExerciseIds) {
            const key = exId.toString();
            const attempt = doc.exercises.find((item) => item.exerciseId.toString() === key);
            const accuracy = attempt?.bestAccuracy ?? doc.bestAccuracy;
            const typed = wordCountByExercise.get(key) ?? 0;
            if (typed === 0)
                continue;
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
    let learnLevel = 1;
    for (let i = 0; i < lessons.length; i++) {
        const completed = lessonProgressDocs.some((doc) => doc.completedAt && doc.lessonId.toString() === lessons[i]._id.toString());
        const previousDone = i === 0 || lessonProgressDocs.some((doc) => doc.completedAt && doc.lessonId.toString() === lessons[i - 1]._id.toString());
        if (previousDone && !completed) {
            learnLevel = lessons[i].order;
            break;
        }
    }
    if (lessons.length > 0 && lessonProgressDocs.filter((doc) => doc.completedAt).length === lessons.length) {
        learnLevel = lessons[lessons.length - 1].order;
    }
    const typing = typingTotals[0];
    const typedSessions = typing?.sessions ?? 0;
    const totalCorrect = (typing?.correctWords ?? 0) + learnCorrectWords;
    const totalTyped = (typing?.attemptedWords ?? 0) + learnTypedWords;
    const avgAccuracy = totalTyped > 0 ? Math.round((totalCorrect / totalTyped) * 1000) / 10 : 0;
    const avgWpm = typedSessions > 0 ? Math.round((typing.wpmSum ?? 0) / typedSessions) : 0;
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
        certificateParagraphId: input.certificateParagraphId,
        certificateParagraphText: input.certificateParagraphText,
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
        certificateParagraphId: input.certificateParagraphId,
        certificateParagraphText: input.certificateParagraphText,
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