"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameDay = isSameDay;
exports.updateStreak = updateStreak;
const Streak_1 = __importDefault(require("../models/Streak"));
function isSameDay(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
function isYesterday(date, today) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return isSameDay(date, yesterday);
}
async function updateStreak(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = await Streak_1.default.findOne({ userId });
    if (!streak) {
        streak = await Streak_1.default.create({
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: today,
            streakHistory: [{ date: today, sessionCount: 1 }],
        });
        return streak;
    }
    if (streak.lastActiveDate && isSameDay(streak.lastActiveDate, today)) {
        // Already tracked today — increment session count in history
        const lastEntry = streak.streakHistory[streak.streakHistory.length - 1];
        if (lastEntry && isSameDay(lastEntry.date, today)) {
            lastEntry.sessionCount += 1;
        }
        await streak.save();
        return streak;
    }
    if (streak.lastActiveDate && isYesterday(streak.lastActiveDate, today)) {
        // Consecutive day — extend streak
        streak.currentStreak += 1;
    }
    else {
        // Gap in streak — reset
        streak.currentStreak = 1;
    }
    if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
    }
    streak.lastActiveDate = today;
    streak.streakHistory.push({ date: today, sessionCount: 1 });
    // Keep history to last 90 days
    if (streak.streakHistory.length > 90) {
        streak.streakHistory = streak.streakHistory.slice(-90);
    }
    await streak.save();
    return streak;
}
//# sourceMappingURL=streak.service.js.map