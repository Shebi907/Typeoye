"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XP_VALUES = exports.MAX_LEVEL = exports.LEVEL_TIERS = void 0;
exports.deriveLevelFromXp = deriveLevelFromXp;
exports.computeSessionXp = computeSessionXp;
exports.awardXp = awardXp;
exports.syncProfileLevel = syncProfileLevel;
const Profile_1 = __importDefault(require("../models/Profile"));
// Increasing XP gaps between tiers: 100 / 150 / 200 / 250 / 300
exports.LEVEL_TIERS = [
    { level: 1, title: 'Typing Beginner', xpRequired: 0 },
    { level: 2, title: 'Typing Learner', xpRequired: 100 },
    { level: 3, title: 'Typing Apprentice', xpRequired: 250 },
    { level: 4, title: 'Typing Pro', xpRequired: 450 },
    { level: 5, title: 'Typing Expert', xpRequired: 700 },
    { level: 6, title: 'Keyboard Master', xpRequired: 1000 },
];
exports.MAX_LEVEL = exports.LEVEL_TIERS[exports.LEVEL_TIERS.length - 1];
function deriveLevelFromXp(totalXP) {
    let level = exports.LEVEL_TIERS[0].level;
    let title = exports.LEVEL_TIERS[0].title;
    for (let i = exports.LEVEL_TIERS.length - 1; i >= 0; i--) {
        if (totalXP >= exports.LEVEL_TIERS[i].xpRequired) {
            level = exports.LEVEL_TIERS[i].level;
            title = exports.LEVEL_TIERS[i].title;
            break;
        }
    }
    const current = exports.LEVEL_TIERS.find((t) => t.level === level);
    const next = exports.LEVEL_TIERS.find((t) => t.level === level + 1) ?? null;
    const xpIntoLevel = totalXP - current.xpRequired;
    const xpForLevel = next ? next.xpRequired - current.xpRequired : 0;
    const xpToNext = next ? Math.max(0, next.xpRequired - totalXP) : 0;
    const progressPct = next ? Math.min(100, (xpIntoLevel / xpForLevel) * 100) : 100;
    return {
        level,
        title,
        totalXP,
        xpIntoLevel,
        xpForLevel,
        xpToNext,
        nextTitle: next?.title ?? null,
        progressPct,
        isMaxLevel: !next,
    };
}
// Base XP granted for a completed, server-verified session.
exports.XP_VALUES = {
    testComplete: 20,
    practiceComplete: 10,
    gameComplete: 10,
    lessonExercisePassed: 10,
    lessonCompleteBonus: 40,
    personalBestBonus: 15,
    perfectAccuracyBonus: 25,
    highAccuracyBonus: 10, // 95% <= accuracy < 100%
    dailyActivityBonus: 10, // first qualifying activity on a calendar day
};
/**
 * Compute the XP earned for a completed typing session (test / practice / game).
 * Pure — does not persist anything.
 */
function computeSessionXp(input) {
    const breakdown = [];
    const base = input.mode === 'test'
        ? exports.XP_VALUES.testComplete
        : input.mode === 'practice'
            ? exports.XP_VALUES.practiceComplete
            : exports.XP_VALUES.gameComplete;
    if (base > 0)
        breakdown.push({ label: `${input.mode} complete`, value: base });
    let total = base;
    if (input.isPersonalBest) {
        breakdown.push({ label: 'New personal best', value: exports.XP_VALUES.personalBestBonus });
        total += exports.XP_VALUES.personalBestBonus;
    }
    if (input.stats.accuracy >= 100) {
        breakdown.push({ label: 'Perfect accuracy', value: exports.XP_VALUES.perfectAccuracyBonus });
        total += exports.XP_VALUES.perfectAccuracyBonus;
    }
    else if (input.stats.accuracy >= 95) {
        breakdown.push({ label: 'High accuracy', value: exports.XP_VALUES.highAccuracyBonus });
        total += exports.XP_VALUES.highAccuracyBonus;
    }
    if (input.isFirstActivityToday) {
        breakdown.push({ label: 'Daily activity', value: exports.XP_VALUES.dailyActivityBonus });
        total += exports.XP_VALUES.dailyActivityBonus;
    }
    return { total, breakdown };
}
/**
 * Atomically add XP to a user's profile and recompute level/title from the
 * authoritative total. Never trusts a client-provided level.
 */
async function awardXp(userId, amount) {
    const prev = await Profile_1.default.findOne({ userId });
    if (!prev) {
        // Registration always creates a Profile; treat absence defensively.
        return {
            xpEarned: amount,
            prevXP: 0,
            newXP: 0,
            prevLevel: 1,
            newLevel: 1,
            leveledUp: false,
            levelTitle: exports.LEVEL_TIERS[0].title,
            breakdown: [],
        };
    }
    const prevXP = prev.totalXP;
    const prevLevel = prev.level;
    const profile = (await Profile_1.default.findOneAndUpdate({ userId }, { $inc: { totalXP: amount } }, { new: true }));
    if (!profile) {
        return {
            xpEarned: amount,
            prevXP,
            newXP: prevXP,
            prevLevel,
            newLevel: prevLevel,
            leveledUp: false,
            levelTitle: prev.levelTitle || exports.LEVEL_TIERS[0].title,
            breakdown: [],
        };
    }
    const derived = deriveLevelFromXp(profile.totalXP);
    const leveledUp = derived.level > prevLevel;
    if (profile.level !== derived.level || profile.levelTitle !== derived.title) {
        profile.level = derived.level;
        profile.levelTitle = derived.title;
        await profile.save();
    }
    return {
        xpEarned: amount,
        prevXP,
        newXP: profile.totalXP,
        prevLevel,
        newLevel: derived.level,
        leveledUp,
        levelTitle: derived.title,
        breakdown: [],
    };
}
/**
 * Defensive: make sure a profile's stored level/title match its total XP.
 * Called on login/me so old profiles self-heal and the server stays authoritative.
 */
async function syncProfileLevel(userId) {
    const profile = await Profile_1.default.findOne({ userId });
    if (!profile)
        return null;
    const derived = deriveLevelFromXp(profile.totalXP);
    if (profile.level !== derived.level || profile.levelTitle !== derived.title) {
        profile.level = derived.level;
        profile.levelTitle = derived.title;
        await profile.save();
    }
    return profile;
}
//# sourceMappingURL=gamification.service.js.map