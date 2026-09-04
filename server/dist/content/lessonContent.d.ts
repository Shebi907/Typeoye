import { Types } from 'mongoose';
export declare function seededShuffle<T>(items: readonly T[], seed: string): T[];
export declare function seedFor(exerciseId: Types.ObjectId | string, contentIndex: number, salt?: string): string;
export declare const HOME_ROW_KEYS: string[];
export declare const TOP_ROW_KEYS: string[];
export declare const BOTTOM_ROW_KEYS: string[];
export declare const ROW_WORDS: Record<string, string[]>;
export declare const COMBINATION_WORDS: string[];
export declare const EASY_WORDS: string[];
export declare const MEDIUM_WORDS: string[];
export declare const HARD_WORDS: string[];
export declare const DIGRAPH_SETS: string[][];
export declare const ADVANCED_TEXTS: string[];
export declare const MASTERY_TEXTS: string[];
export interface ExerciseForContent {
    _id: Types.ObjectId | string;
    type: string;
    difficulty: number;
    targetKeys: string[];
}
/**
 * Builds a deterministic pool of distinct content sets for an exercise.
 * Each set has its own fixed sequence (seeded), so `buildContentSets(x, n)`
 * always returns the same content for the same `n`.
 */
export declare function buildContentSets(exercise: ExerciseForContent, lessonCategory: string): Promise<string[]>;
//# sourceMappingURL=lessonContent.d.ts.map