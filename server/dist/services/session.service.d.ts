import { Types } from 'mongoose';
export interface TypedWordInput {
    word: string;
    typed: string;
    correct: boolean;
    timeTakenMs: number;
}
export interface SessionInput {
    mode: 'test' | 'practice' | 'lesson' | 'game';
    startTime: string;
    endTime: string;
    typedWords: TypedWordInput[];
    textSource: 'generated' | 'lesson' | 'custom';
    exerciseId?: string;
    clientWpm?: number;
    clientAccuracy?: number;
    practiceType?: string;
    practiceDifficulty?: number;
    focusKeys?: string[];
}
export interface ProcessedSession {
    session: any;
    result: any;
    newAchievements: any[];
    xpEarned: number;
    leveledUp: boolean;
    prevXP: number;
    newXP: number;
    level: number;
    prevLevel: number;
    levelTitle: string;
    xpBreakdown: {
        label: string;
        value: number;
    }[];
    streak: any;
    isFirstActivityToday: boolean;
    isPersonalBest: boolean;
}
/**
 * Best WPM derived ONLY from typing Test and Certificate results, both of which
 * are stored as TypingResult rows with `mode === 'test'` (a certificate run is a
 * timed test flagged ?cert=1 on the client). Practice, Learn and game sessions
 * are excluded. Returns the highest test-mode WPM, or `null` when the user has
 * no test/certificate results at all.
 */
export declare function getTestBestWpm(userId: Types.ObjectId | string): Promise<number | null>;
/**
 * Single source of truth for a verified typing session.
 * All stats are computed server-side - client values are never trusted.
 * Used by both the typing and games submission flows.
 * Only called for authenticated users - guest activity is never stored.
 */
export declare function processVerifiedTypingSession(userId: Types.ObjectId | string, input: SessionInput, startTime: Date, endTime: Date): Promise<ProcessedSession>;
//# sourceMappingURL=session.service.d.ts.map