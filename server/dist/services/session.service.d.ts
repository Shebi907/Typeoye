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
    certificateParagraphId?: string;
    certificateParagraphText?: string;
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
export interface ProfileProgressStats {
    totalSessions: number;
    bestWpm: number | null;
    avgWpm: number;
    avgAccuracy: number;
    totalMinutesPracticed: number;
    learnLevel: number;
    completedLessons: number;
    totalLessons: number;
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
export declare function getProfileStats(userId: Types.ObjectId | string): Promise<ProfileProgressStats>;
/**
 * Single source of truth for a verified typing session.
 * All stats are computed server-side - client values are never trusted.
 * Used by both the typing and games submission flows.
 * Only called for authenticated users - guest activity is never stored.
 */
export declare function processVerifiedTypingSession(userId: Types.ObjectId | string, input: SessionInput, startTime: Date, endTime: Date): Promise<ProcessedSession>;
//# sourceMappingURL=session.service.d.ts.map