import { AchievementParams, IAchievement } from '../models/Achievement';
import mongoose from 'mongoose';
interface TestSnapshot {
    wpm: number;
    accuracy: number;
    durationSeconds: number;
}
export interface AchievementContext {
    testCount: number;
    practiceCount: number;
    bestWpm: number;
    bestTestAccuracy: number;
    currentStreak: number;
    lessonCount: number;
    tests: TestSnapshot[];
}
export interface AchievementStatus {
    _id: unknown;
    name: string;
    description: string;
    icon: string;
    condition: {
        type: string;
        threshold: number;
    };
    params?: AchievementParams;
    xpReward: number;
    rarity: string;
    unlocked: boolean;
    unlockedAt: Date | null;
    current: number;
    progress: number;
}
export declare function checkAndAwardAchievements(userId: mongoose.Types.ObjectId | string): Promise<IAchievement[]>;
/**
 * Full achievement inventory with server-computed unlock status and
 * progress, used by the Dashboard achievements tab. Returns a flat list
 * of achievements where `progress` is the user's raw current value and
 * `unlocked` reflects a real, stored unlock.
 */
export declare function getAchievementsForUser(userId: mongoose.Types.ObjectId | string): Promise<AchievementStatus[]>;
export declare const getUserAchievements: typeof getAchievementsForUser;
export {};
//# sourceMappingURL=achievement.service.d.ts.map