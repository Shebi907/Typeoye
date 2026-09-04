"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VARIANTS = void 0;
exports.getExerciseVariants = getExerciseVariants;
const levels_foundation_1 = require("./content/levels-foundation");
const levels_foundation_2 = require("./content/levels-foundation");
const levels_foundation_3 = require("./content/levels-foundation");
const levels_foundation_4 = require("./content/levels-foundation");
const levels_building_1 = require("./content/levels-building");
const levels_building_2 = require("./content/levels-building");
const levels_building_3 = require("./content/levels-building");
const levels_building_4 = require("./content/levels-building");
const levels_common_1 = require("./content/levels-common");
const levels_longer_1 = require("./content/levels-longer");
const levels_sentences_1 = require("./content/levels-sentences");
const levels_punctuation_1 = require("./content/levels-punctuation");
const levels_complex_1 = require("./content/levels-complex");
const levels_paragraphs_1 = require("./content/levels-paragraphs");
const levels_advanced_1 = require("./content/levels-advanced");
const levels_advanced_2 = require("./content/levels-advanced");
// ─── Variant registry ──────────────────────────────────────────────────────────
// VARIANTS[lessonOrder][exerciseOrder] = string[]  (1-indexed both dimensions)
// Level 1–5: 3 exercises each
// Level 6–10: 4 exercises each
// Level 11–14: 4 exercises each
// Level 15–16: 5 exercises each
exports.VARIANTS = {
    1: { 1: levels_foundation_1.L1E1, 2: levels_foundation_1.L1E2, 3: levels_foundation_1.L1E3 },
    2: { 1: levels_foundation_2.L2E1, 2: levels_foundation_2.L2E2, 3: levels_foundation_2.L2E3 },
    3: { 1: levels_foundation_3.L3E1, 2: levels_foundation_3.L3E2, 3: levels_foundation_3.L3E3 },
    4: { 1: levels_foundation_4.L4E1, 2: levels_foundation_4.L4E2, 3: levels_foundation_4.L4E3 },
    5: { 1: levels_building_1.L5E1, 2: levels_building_1.L5E2, 3: levels_building_1.L5E3 },
    6: { 1: levels_building_2.L6E1, 2: levels_building_2.L6E2, 3: levels_building_2.L6E3, 4: levels_building_2.L6E4 },
    7: { 1: levels_building_3.L7E1, 2: levels_building_3.L7E2, 3: levels_building_3.L7E3, 4: levels_building_3.L7E4 },
    8: { 1: levels_building_4.L8E1, 2: levels_building_4.L8E2, 3: levels_building_4.L8E3, 4: levels_building_4.L8E4 },
    9: { 1: levels_common_1.L9E1, 2: levels_common_1.L9E2, 3: levels_common_1.L9E3, 4: levels_common_1.L9E4 },
    10: { 1: levels_longer_1.L10E1, 2: levels_longer_1.L10E2, 3: levels_longer_1.L10E3, 4: levels_longer_1.L10E4 },
    11: { 1: levels_sentences_1.L11E1, 2: levels_sentences_1.L11E2, 3: levels_sentences_1.L11E3, 4: levels_sentences_1.L11E4 },
    12: { 1: levels_punctuation_1.L12E1, 2: levels_punctuation_1.L12E2, 3: levels_punctuation_1.L12E3, 4: levels_punctuation_1.L12E4 },
    13: { 1: levels_complex_1.L13E1, 2: levels_complex_1.L13E2, 3: levels_complex_1.L13E3, 4: levels_complex_1.L13E4 },
    14: { 1: levels_paragraphs_1.L14E1, 2: levels_paragraphs_1.L14E2, 3: levels_paragraphs_1.L14E3, 4: levels_paragraphs_1.L14E4 },
    15: { 1: levels_advanced_1.L15E1, 2: levels_advanced_1.L15E2, 3: levels_advanced_1.L15E3, 4: levels_advanced_1.L15E4, 5: levels_advanced_1.L15E5 },
    16: { 1: levels_advanced_2.L16E1, 2: levels_advanced_2.L16E2, 3: levels_advanced_2.L16E3, 4: levels_advanced_2.L16E4, 5: levels_advanced_2.L16E5 },
};
/**
 * Returns the pre-written variant pool for a given lesson + exercise.
 * Falls back to [baseContent] when no pre-written pool exists.
 */
function getExerciseVariants(lessonOrder, exerciseOrder, baseContent) {
    const pool = exports.VARIANTS[lessonOrder]?.[exerciseOrder];
    if (pool && pool.length > 0)
        return pool;
    return [baseContent];
}
//# sourceMappingURL=lessonContent.service.js.map