import { IProfile } from '../models/Profile';
import mongoose from 'mongoose';
export interface LevelDef {
    level: number;
    title: string;
    minXP: number;
}
export declare const LEVEL_DEFS: LevelDef[];
export interface LevelInfo {
    level: number;
    title: string;
    currentMinXP: number;
    xpIntoLevel: number;
    xpForNextLevel: number;
    nextLevelTitle: string;
    isMaxTitle: boolean;
}
export declare function levelInfo(totalXP: number): LevelInfo;
export declare const XP_CONFIG: {
    readonly testComplete: 40;
    readonly practiceComplete: 25;
    readonly gameComplete: 25;
    readonly lessonExercise: 20;
    readonly lessonComplete: 60;
    readonly newPersonalBest: 30;
    readonly highAccuracy: 15;
    readonly perfectAccuracy: 35;
    readonly dailyActivity: 10;
};
export type XpSessionMode = 'test' | 'practice' | 'lesson' | 'game';
export interface XpSessionInput {
    mode: XpSessionMode;
    wpm: number;
    accuracy: number;
    isNewPersonalBest: boolean;
    completedFirstExercise: boolean;
    completedLesson: boolean;
    achievementXp: number;
    firstActivityToday: boolean;
}
export declare function computeSessionXp(input: XpSessionInput): number;
export interface XpAwardResult {
    xpEarned: number;
    prevXP: number;
    newXP: number;
    prevLevel: number;
    level: number;
    leveledUp: boolean;
    levelInfo: LevelInfo;
}
/**
 * Server-authoritative XP award. XP is added to the profile only after
 * the underlying action has been validated by the caller against stored
 * session data. Client-submitted XP is never used.
 */
export declare function awardSessionXp(userId: mongoose.Types.ObjectId | string, input: Omit<XpSessionInput, 'firstActivityToday'> & {
    firstActivityToday?: boolean;
}): Promise<XpAwardResult | null>;
export declare function profileWithLevel(profile: IProfile): any;
//# sourceMappingURL=xp.service.d.ts.map