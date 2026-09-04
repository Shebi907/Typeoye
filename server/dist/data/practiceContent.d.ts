export type PracticeDifficulty = 'beginner' | 'intermediate' | 'advanced';
export declare const WORD_BANKS: Record<PracticeDifficulty, string[]>;
export declare const SENTENCE_BANKS: Record<PracticeDifficulty, string[]>;
export declare const PARAGRAPH_BANKS: Record<PracticeDifficulty, string[]>;
export declare function hashSeed(s: string): number;
export declare const seededShuffle: <T>(items: T[], rand: () => number) => T[];
export declare function variationCount(type: string): number;
export declare function variationAt(type: string, difficulty: PracticeDifficulty, focusKeys: string[], index: number): string;
//# sourceMappingURL=practiceContent.d.ts.map