import mongoose from 'mongoose';
import { IProfile } from '../models/Profile';
import { ComputedStats } from './wpm.service';
/**
 * AUTHORITATIVE GAMIFICATION LAYER
 *
 * XP totals, level, and level title are always derived server-side from real,
 * stored activity. The client never submits or claims XP — it only receives the
 * results of actions the server itself validated and saved.
 */
export interface LevelTier {
    level: number;
    title: string;
    xpRequired: number;
}
export declare const LEVEL_TIERS: LevelTier[];
export declare const MAX_LEVEL: LevelTier;
export interface LevelInfo {
    level: number;
    title: string;
    totalXP: number;
    xpIntoLevel: number;
    xpForLevel: number;
    xpToNext: number;
    nextTitle: string | null;
    progressPct: number;
    isMaxLevel: boolean;
}
export declare function deriveLevelFromXp(totalXP: number): LevelInfo;
export declare const XP_VALUES: {
    readonly testComplete: 20;
    readonly practiceComplete: 10;
    readonly gameComplete: 10;
    readonly lessonExercisePassed: 10;
    readonly lessonCompleteBonus: 40;
    readonly personalBestBonus: 15;
    readonly perfectAccuracyBonus: 25;
    readonly highAccuracyBonus: 10;
    readonly dailyActivityBonus: 10;
};
export interface SessionAward {
    mode: 'test' | 'practice' | 'lesson' | 'game';
    stats: ComputedStats;
    isPersonalBest: boolean;
    isFirstActivityToday: boolean;
}
export interface AwardResult {
    xpEarned: number;
    prevXP: number;
    newXP: number;
    prevLevel: number;
    newLevel: number;
    leveledUp: boolean;
    levelTitle: string;
    breakdown: {
        label: string;
        value: number;
    }[];
}
/**
 * Compute the XP earned for a completed typing session (test / practice / game).
 * Pure — does not persist anything.
 */
export declare function computeSessionXp(input: SessionAward): {
    total: number;
    breakdown: {
        label: string;
        value: number;
    }[];
};
/**
 * Atomically add XP to a user's profile and recompute level/title from the
 * authoritative total. Never trusts a client-provided level.
 */
export declare function awardXp(userId: mongoose.Types.ObjectId | string, amount: number): Promise<AwardResult>;
/**
 * Defensive: make sure a profile's stored level/title match its total XP.
 * Called on login/me so old profiles self-heal and the server stays authoritative.
 */
export declare function syncProfileLevel(userId: mongoose.Types.ObjectId | string): Promise<IProfile | null>;
//# sourceMappingURL=gamification.service.d.ts.map