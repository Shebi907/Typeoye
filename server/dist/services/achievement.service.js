"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAchievements = void 0;
exports.checkAndAwardAchievements = checkAndAwardAchievements;
exports.getAchievementsForUser = getAchievementsForUser;
const Achievement_1 = __importDefault(require("../models/Achievement"));
const UserAchievement_1 = __importDefault(require("../models/UserAchievement"));
const TypingResult_1 = __importDefault(require("../models/TypingResult"));
const TypingSession_1 = __importDefault(require("../models/TypingSession"));
const PracticeSession_1 = __importDefault(require("../models/PracticeSession"));
const LessonProgress_1 = __importDefault(require("../models/LessonProgress"));
const Streak_1 = __importDefault(require("../models/Streak"));
const UserProgress_1 = __importDefault(require("../models/UserProgress"));
/**
 * All achievement conditions are derived from real, stored session data.
 * Nothing here comes from the client.
 *
 * Durations come from the matching TypingSession so that tests completed
 * before per-test durations existed still qualify for time-based rules.
 */
async function buildContext(userId) {
    const [testCount, practiceCount, streak, progress, lessonCount, bestTestAccuracy, tests] = await Promise.all([
        TypingResult_1.default.countDocuments({ userId, mode: 'test' }),
        PracticeSession_1.default.countDocuments({ userId }),
        Streak_1.default.findOne({ userId }),
        UserProgress_1.default.findOne({ userId }),
        LessonProgress_1.default.countDocuments({
            userId,
            completedAt: { $exists: true },
            bestAccuracy: { $gte: 90 },
        }),
        TypingResult_1.default.aggregate([
            { $match: { userId, mode: 'test' } },
            { $group: { _id: null, max: { $max: '$accuracy' } } },
        ]),
        TypingResult_1.default.aggregate([
            { $match: { userId, mode: 'test' } },
            {
                $lookup: {
                    from: TypingSession_1.default.collection.name,
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
    return {
        testCount,
        practiceCount,
        bestWpm: progress?.bestWpm ?? 0,
        bestTestAccuracy: bestTestAccuracy[0]?.max ?? 0,
        currentStreak: streak?.currentStreak ?? 0,
        lessonCount,
        tests,
    };
}
function testMeets(t, opts) {
    return (t.wpm >= (opts.minWpm ?? 0) &&
        t.accuracy >= (opts.minAccuracy ?? 0) &&
        (t.durationSeconds ?? 0) >= (opts.minDuration ?? 0));
}
function qualifies(type, threshold, params, ctx) {
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
        default:
            return false;
    }
}
function currentValue(type, threshold, params, ctx) {
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
        default:
            return 0;
    }
}
async function checkAndAwardAchievements(userId) {
    const [allAchievements, existing] = await Promise.all([
        Achievement_1.default.find({ isActive: true }),
        UserAchievement_1.default.find({ userId }).select('achievementId'),
    ]);
    const unlockedIds = new Set(existing.map((ua) => ua.achievementId.toString()));
    const ctx = await buildContext(userId);
    const newlyUnlocked = [];
    for (const achievement of allAchievements) {
        if (unlockedIds.has(achievement._id.toString()))
            continue;
        if (!qualifies(achievement.condition.type, achievement.condition.threshold, achievement.params, ctx))
            continue;
        await UserAchievement_1.default.create({
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
async function getAchievementsForUser(userId) {
    const [all, userAchievements] = await Promise.all([
        Achievement_1.default.find({ isActive: true }),
        UserAchievement_1.default.find({ userId }),
    ]);
    const ctx = await buildContext(userId);
    const unlockedMap = new Map(userAchievements.map((ua) => [ua.achievementId.toString(), ua]));
    return all.map((achievement) => {
        const doc = unlockedMap.get(achievement._id.toString());
        const current = currentValue(achievement.condition.type, achievement.condition.threshold, achievement.params, ctx);
        return {
            ...achievement.toObject(),
            unlocked: Boolean(doc),
            unlockedAt: doc?.unlockedAt ?? null,
            current,
            progress: current,
        };
    });
}
exports.getUserAchievements = getAchievementsForUser;
//# sourceMappingURL=achievement.service.js.map