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

import { L1E1, L1E2, L1E3 } from './content/levels-foundation';
import { L2E1, L2E2, L2E3 } from './content/levels-foundation';
import { L3E1, L3E2, L3E3 } from './content/levels-foundation';
import { L4E1, L4E2, L4E3 } from './content/levels-foundation';

import { L5E1, L5E2, L5E3 } from './content/levels-building';
import { L6E1, L6E2, L6E3, L6E4 } from './content/levels-building';
import { L7E1, L7E2, L7E3, L7E4 } from './content/levels-building';
import { L8E1, L8E2, L8E3, L8E4 } from './content/levels-building';

import { L9E1, L9E2, L9E3, L9E4 } from './content/levels-common';
import { L10E1, L10E2, L10E3, L10E4 } from './content/levels-longer';

import { L11E1, L11E2, L11E3, L11E4 } from './content/levels-sentences';
import { L12E1, L12E2, L12E3, L12E4 } from './content/levels-punctuation';
import { L13E1, L13E2, L13E3, L13E4 } from './content/levels-complex';
import { L14E1, L14E2, L14E3, L14E4 } from './content/levels-paragraphs';

import { L15E1, L15E2, L15E3, L15E4, L15E5 } from './content/levels-advanced';
import { L16E1, L16E2, L16E3, L16E4, L16E5 } from './content/levels-advanced';

// ─── Variant registry ──────────────────────────────────────────────────────────
// VARIANTS[lessonOrder][exerciseOrder] = string[]  (1-indexed both dimensions)
// Level 1–5: 3 exercises each
// Level 6–10: 4 exercises each
// Level 11–14: 4 exercises each
// Level 15–16: 5 exercises each
export const VARIANTS: Record<number, Record<number, string[]>> = {
  1:  { 1: L1E1,  2: L1E2,  3: L1E3 },
  2:  { 1: L2E1,  2: L2E2,  3: L2E3 },
  3:  { 1: L3E1,  2: L3E2,  3: L3E3 },
  4:  { 1: L4E1,  2: L4E2,  3: L4E3 },
  5:  { 1: L5E1,  2: L5E2,  3: L5E3 },
  6:  { 1: L6E1,  2: L6E2,  3: L6E3,  4: L6E4 },
  7:  { 1: L7E1,  2: L7E2,  3: L7E3,  4: L7E4 },
  8:  { 1: L8E1,  2: L8E2,  3: L8E3,  4: L8E4 },
  9:  { 1: L9E1,  2: L9E2,  3: L9E3,  4: L9E4 },
  10: { 1: L10E1, 2: L10E2, 3: L10E3, 4: L10E4 },
  11: { 1: L11E1, 2: L11E2, 3: L11E3, 4: L11E4 },
  12: { 1: L12E1, 2: L12E2, 3: L12E3, 4: L12E4 },
  13: { 1: L13E1, 2: L13E2, 3: L13E3, 4: L13E4 },
  14: { 1: L14E1, 2: L14E2, 3: L14E3, 4: L14E4 },
  15: { 1: L15E1, 2: L15E2, 3: L15E3, 4: L15E4, 5: L15E5 },
  16: { 1: L16E1, 2: L16E2, 3: L16E3, 4: L16E4, 5: L16E5 },
};

/**
 * Returns the pre-written variant pool for a given lesson + exercise.
 * Falls back to [baseContent] when no pre-written pool exists.
 */
export function getExerciseVariants(
  lessonOrder: number,
  exerciseOrder: number,
  baseContent: string,
): string[] {
  const pool = VARIANTS[lessonOrder]?.[exerciseOrder];
  if (pool && pool.length > 0) return pool;
  return [baseContent];
}
