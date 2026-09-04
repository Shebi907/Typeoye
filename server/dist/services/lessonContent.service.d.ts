/**
 * lessonContent.service.ts
 *
 * Pre-written exercise variant pools for all 16 Learn levels.
 * Content is split into separate files by difficulty tier for maintainability.
 * Each exercise has 8–10 unique variant strings.
 * No text is reused across any level or exercise (globally unique).
 *
 * Structure: VARIANTS[lessonOrder][exerciseOrder] → string[]
 * lessonOrder and exerciseOrder are 1-indexed.
 */
export declare const VARIANTS: Record<number, Record<number, string[]>>;
/**
 * Returns the pre-written variant pool for a given lesson + exercise.
 * Falls back to [baseContent] when no pre-written pool exists.
 */
export declare function getExerciseVariants(lessonOrder: number, exerciseOrder: number, baseContent: string): string[];
//# sourceMappingURL=lessonContent.service.d.ts.map