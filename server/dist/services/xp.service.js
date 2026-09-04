"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XP_CONFIG = exports.LEVEL_DEFS = void 0;
exports.levelInfo = levelInfo;
exports.computeSessionXp = computeSessionXp;
exports.awardSessionXp = awardSessionXp;
exports.profileWithLevel = profileWithLevel;
const Profile_1 = __importDefault(require("../models/Profile"));
exports.LEVEL_DEFS = [
    { level: 1, title: 'Typing Beginner', minXP: 0 },
    { level: 2, title: 'Typing Learner', minXP: 100 },
    { level: 3, title: 'Typing Apprentice', minXP: 300 },
    { level: 4, title: 'Typing Pro', minXP: 650 },
    { level: 5, title: 'Typing Expert', minXP: 1200 },
    { level: 6, title: 'Keyboard Master', minXP: 2000 },
];
function levelInfo(totalXP) {
    // Beyond the defined tiers keep raising the bar with growing gaps.
    const last = exports.LEVEL_DEFS[exports.LEVEL_DEFS.length - 1];
    if (totalXP >= last.minXP) {
        let threshold = last.minXP;
        let gap = 700;
        let level = last.level;
        while (totalXP >= threshold + gap) {
            threshold += gap;
            level += 1;
            gap += 150;
        }
        return {
            level,
            title: last.title,
            currentMinXP: threshold,
            xpIntoLevel: totalXP - threshold,
            xpForNextLevel: gap,
            nextLevelTitle: last.title,
            isMaxTitle: true,
        };
    }
    let current = exports.LEVEL_DEFS[0];
    for (const def of exports.LEVEL_DEFS) {
        if (totalXP >= def.minXP)
            current = def;
        else
            break;
    }
    const next = exports.LEVEL_DEFS[current.level];
    return {
        level: current.level,
        title: current.title,
        currentMinXP: current.minXP,
        xpIntoLevel: totalXP - current.minXP,
        xpForNextLevel: next ? next.minXP - current.minXP : 100,
        nextLevelTitle: next ? next.title : current.title,
        isMaxTitle: false,
    };
}
// ── XP rewards (balanced so no single action trivializes levels) ───
exports.XP_CONFIG = {
    testComplete: 40,
    practiceComplete: 25,
    gameComplete: 25,
    lessonExercise: 20,
    lessonComplete: 60,
    newPersonalBest: 30,
    highAccuracy: 15, //  98 – 99.9%
    perfectAccuracy: 35, // 100%
    dailyActivity: 10, // first qualifying action of the calendar day
};
function computeSessionXp(input) {
    let xp = 0;
    if (input.mode === 'test')
        xp += exports.XP_CONFIG.testComplete;
    else if (input.mode === 'practice')
        xp += exports.XP_CONFIG.practiceComplete;
    else if (input.mode === 'game')
        xp += exports.XP_CONFIG.gameComplete;
    else if (input.mode === 'lesson' && input.completedFirstExercise) {
        xp += exports.XP_CONFIG.lessonExercise;
    }
    if (input.completedLesson)
        xp += exports.XP_CONFIG.lessonComplete;
    if (input.wpm >= 20 && input.isNewPersonalBest)
        xp += exports.XP_CONFIG.newPersonalBest;
    if (input.accuracy === 100)
        xp += exports.XP_CONFIG.perfectAccuracy;
    else if (input.accuracy >= 98)
        xp += exports.XP_CONFIG.highAccuracy;
    if (input.firstActivityToday)
        xp += exports.XP_CONFIG.dailyActivity;
    return xp + input.achievementXp;
}
function isSameDay(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
/**
 * Server-authoritative XP award. XP is added to the profile only after
 * the underlying action has been validated by the caller against stored
 * session data. Client-submitted XP is never used.
 */
async function awardSessionXp(userId, input) {
    const profile = await Profile_1.default.findOne({ userId });
    if (!profile)
        return null;
    const prevXP = profile.totalXP;
    const prevInfo = levelInfo(prevXP);
    const firstActivityToday = input.firstActivityToday ?? !(profile.lastDailyXpAt && isSameDay(profile.lastDailyXpAt, new Date()));
    const xpEarned = computeSessionXp({ ...input, firstActivityToday });
    if (xpEarned <= 0) {
        return {
            xpEarned: 0,
            prevXP,
            newXP: prevXP,
            prevLevel: prevInfo.level,
            level: prevInfo.level,
            leveledUp: false,
            levelInfo: prevInfo,
        };
    }
    const newXP = prevXP + xpEarned;
    const info = levelInfo(newXP);
    const leveledUp = info.level > prevInfo.level;
    profile.totalXP = newXP;
    profile.level = info.level;
    if (firstActivityToday)
        profile.lastDailyXpAt = new Date();
    await profile.save();
    return { xpEarned, prevXP, newXP, prevLevel: prevInfo.level, level: info.level, leveledUp, levelInfo: info };
}
function profileWithLevel(profile) {
    const plain = profile.toObject();
    return { ...plain, levelInfo: levelInfo(profile.totalXP) };
}
//# sourceMappingURL=xp.service.js.map