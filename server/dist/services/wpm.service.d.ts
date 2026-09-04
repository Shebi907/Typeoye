export declare function getLevelTitle(level: number): string;
export declare function calculateLevelFromXP(totalXP: number): {
    level: number;
    title: string;
    currentXP: number;
    nextLevelXP: number;
};
export interface TypedWord {
    word: string;
    typed: string;
    correct: boolean;
    timeTakenMs: number;
}
export interface ComputedStats {
    wpm: number;
    accuracy: number;
    correctWords: number;
    attemptedWords: number;
    errorsCount: number;
}
/**
 * AUTHORITATIVE WPM COMPUTATION
 * WPM = correctWords / (durationSeconds / 60)
 * Accuracy = (correctWords / attemptedWords) * 100
 *
 * Test cases (all must pass):
 *   52 correct / 60s  => 52 WPM
 *   67 correct / 60s  => 67 WPM  (3 incorrect don't affect WPM)
 *   30 correct / 30s  => 60 WPM
 *  100 correct / 120s => 50 WPM
 */
export declare function computeStats(typedWords: TypedWord[], durationSeconds: number): ComputedStats;
/**
 * Compute per-character weak key data by comparing expected vs typed strings.
 * Returns a map of { key -> { errors, attempts } }
 */
export declare function computeWeakKeys(typedWords: TypedWord[]): Map<string, {
    errors: number;
    attempts: number;
}>;
//# sourceMappingURL=wpm.service.d.ts.map