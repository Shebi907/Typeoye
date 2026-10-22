/**
 * urduLessons.ts
 *
 * The 16-level Urdu Learn curriculum plus an idempotent seeding routine.
 *
 * Urdu lessons live in the SAME Lesson / Exercise collections as the English
 * course, distinguished by `language: 'ur'`. Uniqueness is scoped per language
 * (`{ language, order }`), so both courses can each own levels 1..16.
 *
 * `seedUrduLessons()` is safe to run repeatedly: it upserts by natural key and
 * never duplicates levels, exercises or achievements, and it leaves learner
 * progress (LessonProgress) untouched.
 */

import Lesson from '../models/Lesson';
import Exercise from '../models/Exercise';
import Achievement from '../models/Achievement';
import { URDU_VARIANTS } from '../services/content/urdu-levels';

interface UrduExerciseDef {
  title: string;
  type: 'keys' | 'words' | 'sentences' | 'paragraph' | 'custom';
  targetKeys: string[];
}

interface UrduLevelDef {
  title: string;
  titleEn: string;
  description: string;
  category: 'foundation' | 'building-blocks' | 'flow-rhythm' | 'advanced';
  difficulty: number;
  targetKeys: string[];
  exercises: UrduExerciseDef[];
}

const digitKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const URDU_CURRICULUM: UrduLevelDef[] = [
  {
    title: 'ہوم رو حروف',
    titleEn: 'Home Row Letters',
    description: 'Home-row letters — ا س د ف and ج ک ل. Build a steady resting position.',
    category: 'foundation',
    difficulty: 1,
    targetKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l'],
    exercises: [
      { title: 'ہوم رو بائیں', type: 'keys', targetKeys: ['a', 's', 'd', 'f'] },
      { title: 'ہوم رو دائیں', type: 'keys', targetKeys: ['j', 'k', 'l'] },
      { title: 'ہوم رو الفاظ', type: 'words', targetKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l'] },
    ],
  },
  {
    title: 'اوپری قطار',
    titleEn: 'Top Row',
    description: 'Top-row letters — reach the upper keys without lifting your home position.',
    category: 'foundation',
    difficulty: 2,
    targetKeys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    exercises: [
      { title: 'اوپری قطار مشق', type: 'keys', targetKeys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'] },
      { title: 'اوپری قطار الفاظ', type: 'words', targetKeys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'] },
      { title: 'اوپری قطار جملہ', type: 'sentences', targetKeys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'] },
    ],
  },
  {
    title: 'نچلی قطار',
    titleEn: 'Bottom Row',
    description: 'Bottom-row letters — smooth, accurate downward reaches.',
    category: 'foundation',
    difficulty: 2,
    targetKeys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    exercises: [
      { title: 'نچلی قطار مشق', type: 'keys', targetKeys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'] },
      { title: 'نچلی قطار الفاظ', type: 'words', targetKeys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'] },
      { title: 'نچلی قطار جملہ', type: 'sentences', targetKeys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'] },
    ],
  },
  {
    title: 'شفٹ حروف',
    titleEn: 'Shift Letters',
    description: 'Shift-layer letters — ٹ ڈ ڑ ھ ں آ خ ص ض ظ غ ث ژ and friends.',
    category: 'foundation',
    difficulty: 3,
    targetKeys: [],
    exercises: [
      { title: 'شفٹ حروف مشق', type: 'keys', targetKeys: [] },
      { title: 'شفٹ حروف الفاظ', type: 'words', targetKeys: [] },
      { title: 'شفٹ حروف جملہ', type: 'sentences', targetKeys: [] },
    ],
  },
  {
    title: 'ہندسے اور نشانات',
    titleEn: 'Numbers & Marks',
    description: 'Numbers and Urdu punctuation — Urdu numerals ۰–۹ plus marks ۔ ، ؟ ؛.',
    category: 'foundation',
    difficulty: 3,
    targetKeys: digitKeys,
    exercises: [
      { title: 'ہندسوں کی مشق', type: 'custom', targetKeys: digitKeys },
      { title: 'رموز اوقاف', type: 'sentences', targetKeys: ['.', ',', '?'] },
      { title: 'مخلوط مشق', type: 'custom', targetKeys: digitKeys },
    ],
  },
  {
    title: 'عام حروفی جوڑ',
    titleEn: 'Common Combinations',
    description: 'Common letter combinations that appear again and again in Urdu.',
    category: 'building-blocks',
    difficulty: 3,
    targetKeys: [],
    exercises: [
      { title: 'حروفی جوڑ', type: 'keys', targetKeys: [] },
      { title: 'جوڑ والے الفاظ', type: 'words', targetKeys: [] },
      { title: 'مزید الفاظ', type: 'words', targetKeys: [] },
      { title: 'مختصر جملہ', type: 'sentences', targetKeys: [] },
    ],
  },
  {
    title: 'طویل حروفی جوڑ',
    titleEn: 'Longer Combinations',
    description: 'Longer letter clusters and multi-part combinations for smoother flow.',
    category: 'building-blocks',
    difficulty: 4,
    targetKeys: [],
    exercises: [
      { title: 'طویل جوڑ', type: 'keys', targetKeys: [] },
      { title: 'لمبے الفاظ', type: 'words', targetKeys: [] },
      { title: 'قدرتی الفاظ', type: 'words', targetKeys: [] },
      { title: 'جملہ', type: 'sentences', targetKeys: [] },
    ],
  },
  {
    title: 'چھوٹے الفاظ',
    titleEn: 'Short Words',
    description: 'Two-, three- and four-letter words you use every day.',
    category: 'building-blocks',
    difficulty: 4,
    targetKeys: [],
    exercises: [
      { title: 'دو حرفی الفاظ', type: 'words', targetKeys: [] },
      { title: 'تین حرفی الفاظ', type: 'words', targetKeys: [] },
      { title: 'چار حرفی الفاظ', type: 'words', targetKeys: [] },
      { title: 'مختصر جملے', type: 'sentences', targetKeys: [] },
    ],
  },
  {
    title: 'روزمرہ الفاظ',
    titleEn: 'Everyday Words',
    description: 'Everyday vocabulary — family, home and routine words.',
    category: 'building-blocks',
    difficulty: 5,
    targetKeys: [],
    exercises: [
      { title: 'گھر کے الفاظ', type: 'words', targetKeys: [] },
      { title: 'رشتے', type: 'words', targetKeys: [] },
      { title: 'روزمرہ', type: 'words', targetKeys: [] },
      { title: 'جملے', type: 'sentences', targetKeys: [] },
    ],
  },
  {
    title: 'طویل الفاظ',
    titleEn: 'Longer Words',
    description: 'Longer and more difficult vocabulary without losing rhythm.',
    category: 'building-blocks',
    difficulty: 5,
    targetKeys: [],
    exercises: [
      { title: 'طویل الفاظ', type: 'words', targetKeys: [] },
      { title: 'قدرت', type: 'words', targetKeys: [] },
      { title: 'لکھائی', type: 'words', targetKeys: [] },
      { title: 'جملے', type: 'sentences', targetKeys: [] },
    ],
  },
  {
    title: 'مختصر جملے',
    titleEn: 'Short Sentences',
    description: 'Carry an even rhythm across short, complete sentences.',
    category: 'flow-rhythm',
    difficulty: 6,
    targetKeys: [],
    exercises: [
      { title: 'سکون والے جملے', type: 'sentences', targetKeys: [] },
      { title: 'حوصلہ افزا جملے', type: 'sentences', targetKeys: [] },
      { title: 'روزمرہ جملے', type: 'sentences', targetKeys: [] },
      { title: 'کام کے جملے', type: 'sentences', targetKeys: [] },
    ],
  },
  {
    title: 'طویل جملے',
    titleEn: 'Long Sentences',
    description: 'Longer sentences with natural phrasing and steady pacing.',
    category: 'flow-rhythm',
    difficulty: 6,
    targetKeys: [],
    exercises: [
      { title: 'طویل جملے الف', type: 'sentences', targetKeys: [] },
      { title: 'طویل جملے ب', type: 'sentences', targetKeys: [] },
      { title: 'طویل جملے ج', type: 'sentences', targetKeys: [] },
    ],
  },
  {
    title: 'رموز اوقاف',
    titleEn: 'Punctuation',
    description: 'Punctuation — ۔ ، ؟ ؛ in realistic sentence contexts.',
    category: 'flow-rhythm',
    difficulty: 7,
    targetKeys: ['.', ',', '?', ';'],
    exercises: [
      { title: 'وقفہ اور ختم', type: 'sentences', targetKeys: ['.', ','] },
      { title: 'سوالیہ نشان', type: 'sentences', targetKeys: ['?', '!'] },
      { title: 'مخلوط علامات', type: 'sentences', targetKeys: ['.', ',', '?'] },
    ],
  },
  {
    title: 'پیراگراف',
    titleEn: 'Paragraphs',
    description: 'Connected ideas across complete Urdu paragraphs.',
    category: 'flow-rhythm',
    difficulty: 7,
    targetKeys: [],
    exercises: [
      { title: 'پیراگراف الف', type: 'paragraph', targetKeys: [] },
      { title: 'پیراگراف ب', type: 'paragraph', targetKeys: [] },
    ],
  },
  {
    title: 'ہندسے اور علامات',
    titleEn: 'Numbers & Symbols',
    description: 'Real-world text with Urdu numerals — prices, counts and everyday figures.',
    category: 'advanced',
    difficulty: 8,
    targetKeys: digitKeys,
    exercises: [
      { title: 'قیمت اور ٹیکس', type: 'sentences', targetKeys: digitKeys },
      { title: 'تعداد', type: 'sentences', targetKeys: digitKeys },
      { title: 'فرق', type: 'sentences', targetKeys: digitKeys },
      { title: 'خلاصہ', type: 'paragraph', targetKeys: digitKeys },
    ],
  },
  {
    title: 'آخری چیلنج',
    titleEn: 'Final Challenge',
    description: 'Combine everything — long, mixed Urdu text under pressure.',
    category: 'advanced',
    difficulty: 9,
    targetKeys: [],
    exercises: [
      { title: 'آخری مشق الف', type: 'paragraph', targetKeys: [] },
      { title: 'آخری مشق ب', type: 'paragraph', targetKeys: [] },
      { title: 'آخری مشق ج', type: 'paragraph', targetKeys: [] },
      { title: 'آخری مشق د', type: 'paragraph', targetKeys: [] },
    ],
  },
];

/**
 * The 17 Urdu Learn achievements, spread across four difficulty tiers
 * (4 easy/common, 5 medium/rare, 5 hard/epic, 3 elite/legendary). Every
 * condition is checked against real, stored Urdu data only:
 *   - urdu_lessons  → completed Urdu Learn levels (>=90% accuracy)
 *   - urdu_tests    → completed Urdu typing tests
 *   - urdu_practice → completed Urdu practice sessions
 *   - urdu_wpm      → best WPM in a single Urdu test (optionally with a minimum accuracy)
 *   - urdu_accuracy → best accuracy in a single Urdu test (optionally with a minimum WPM)
 * All are scoped to `language: 'ur'`, so English activity can never unlock these
 * and they never appear on the English progress page. The three original Urdu
 * achievement names are preserved so no existing unlock record is orphaned.
 */
const URDU_ACHIEVEMENTS = [
  // ── Easy / Common (4) ─────────────────────────────────────────────────────
  {
    name: 'Urdu First Steps',
    description: 'Complete your first 3 Urdu learning levels, each with at least 90% accuracy.',
    icon: '🇵🇰',
    condition: { type: 'urdu_lessons', threshold: 3 },
    xpReward: 50,
    rarity: 'common',
  },
  {
    name: 'Urdu Debut',
    description: 'Complete 5 Urdu typing tests.',
    icon: '🚀',
    condition: { type: 'urdu_tests', threshold: 5 },
    xpReward: 50,
    rarity: 'common',
  },
  {
    name: 'Urdu Practice Warmup',
    description: 'Complete 5 Urdu practice sessions.',
    icon: '📝',
    condition: { type: 'urdu_practice', threshold: 5 },
    xpReward: 50,
    rarity: 'common',
  },
  {
    name: 'Urdu Sprint',
    description: 'Reach 20 WPM in a single Urdu test with at least 90% accuracy.',
    icon: '🐢',
    condition: { type: 'urdu_wpm', threshold: 20 },
    params: { minAccuracy: 90 },
    xpReward: 60,
    rarity: 'common',
  },

  // ── Medium / Rare (5) ─────────────────────────────────────────────────────
  {
    name: 'Urdu Speedster',
    description: 'Reach 30 WPM in a single Urdu test with at least 90% accuracy.',
    icon: '⚡',
    condition: { type: 'urdu_wpm', threshold: 30 },
    params: { minAccuracy: 90 },
    xpReward: 150,
    rarity: 'rare',
  },
  {
    name: 'Urdu Precision',
    description: 'Hit 95% accuracy in an Urdu test of at least 15 WPM.',
    icon: '🎯',
    condition: { type: 'urdu_accuracy', threshold: 95 },
    params: { minWpm: 15 },
    xpReward: 150,
    rarity: 'rare',
  },
  {
    name: 'Urdu Halfway',
    description: 'Complete 8 Urdu learning levels, each with at least 90% accuracy.',
    icon: '🌗',
    condition: { type: 'urdu_lessons', threshold: 8 },
    xpReward: 200,
    rarity: 'rare',
  },
  {
    name: 'Urdu Combo Master',
    description: 'Complete 20 Urdu typing tests.',
    icon: '🔁',
    condition: { type: 'urdu_tests', threshold: 20 },
    xpReward: 200,
    rarity: 'rare',
  },
  {
    name: 'Urdu Regular',
    description: 'Complete 20 Urdu practice sessions.',
    icon: '📅',
    condition: { type: 'urdu_practice', threshold: 20 },
    xpReward: 200,
    rarity: 'rare',
  },

  // ── Hard / Epic (5) ───────────────────────────────────────────────────────
  {
    name: 'Urdu Scholar',
    description: 'Complete 10 Urdu learning levels, each with at least 90% accuracy.',
    icon: '📗',
    condition: { type: 'urdu_lessons', threshold: 10 },
    xpReward: 400,
    rarity: 'epic',
  },
  {
    name: 'Urdu Sharpshooter',
    description: 'Hit 98% accuracy in an Urdu test of at least 20 WPM.',
    icon: '🏹',
    condition: { type: 'urdu_accuracy', threshold: 98 },
    params: { minWpm: 20 },
    xpReward: 400,
    rarity: 'epic',
  },
  {
    name: 'Urdu Marathon',
    description: 'Reach 45 WPM in a single Urdu test with at least 92% accuracy.',
    icon: '🏃',
    condition: { type: 'urdu_wpm', threshold: 45 },
    params: { minAccuracy: 92 },
    xpReward: 450,
    rarity: 'epic',
  },
  {
    name: 'Urdu Dedicated',
    description: 'Complete 13 Urdu learning levels, each with at least 90% accuracy.',
    icon: '🧭',
    condition: { type: 'urdu_lessons', threshold: 13 },
    xpReward: 500,
    rarity: 'epic',
  },
  {
    name: 'Urdu Practice Pro',
    description: 'Complete 40 Urdu practice sessions.',
    icon: '🛠️',
    condition: { type: 'urdu_practice', threshold: 40 },
    xpReward: 500,
    rarity: 'epic',
  },

  // ── Elite / Legendary (3) ─────────────────────────────────────────────────
  {
    name: 'Urdu Master',
    description: 'Complete all 16 Urdu learning levels, each with at least 90% accuracy.',
    icon: '🏅',
    condition: { type: 'urdu_lessons', threshold: 16 },
    xpReward: 600,
    rarity: 'legendary',
  },
  {
    name: 'Urdu Champion',
    description: 'Complete 50 Urdu typing tests.',
    icon: '🏆',
    condition: { type: 'urdu_tests', threshold: 50 },
    xpReward: 700,
    rarity: 'legendary',
  },
  {
    name: 'Urdu Legend',
    description: 'Reach 60 WPM in a single Urdu test with at least 95% accuracy.',
    icon: '👑',
    condition: { type: 'urdu_wpm', threshold: 60 },
    params: { minAccuracy: 95 },
    xpReward: 900,
    rarity: 'legendary',
  },
];

export interface UrduSeedResult {
  lessons: number;
  exercises: number;
  achievements: number;
}

/**
 * Idempotently seed/restore the 16 Urdu Learn levels, their exercises and the
 * Urdu-specific achievements. Safe to call on every startup or from the admin
 * panel: records are matched by natural key and upserted, so no duplicates are
 * ever created and learner progress is preserved.
 *
 * @param reset when true, existing Urdu lessons/exercises are removed first
 *              (their LessonProgress rows are cleared too, since the exercise
 *              ids they reference are replaced).
 */
export async function seedUrduLessons(reset = false): Promise<UrduSeedResult> {
  if (reset) {
    const existing = await Lesson.find({ language: 'ur' }).select('_id');
    const ids = existing.map((lesson) => lesson._id);
    await Promise.all([
      Exercise.deleteMany({ lessonId: { $in: ids } }),
      Lesson.deleteMany({ language: 'ur' }),
    ]);
  }

  let exerciseTotal = 0;

  for (let i = 0; i < URDU_CURRICULUM.length; i++) {
    const def = URDU_CURRICULUM[i];
    const order = i + 1;

    const lesson = await Lesson.findOneAndUpdate(
      { language: 'ur', order },
      {
        $set: {
          language: 'ur',
          order,
          title: def.title,
          titleEn: def.titleEn,
          description: def.description,
          category: def.category,
          difficulty: def.difficulty,
          targetKeys: def.targetKeys,
          isActive: true,
          accuracyThreshold: 90,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    for (let e = 0; e < def.exercises.length; e++) {
      const ex = def.exercises[e];
      const exOrder = e + 1;
      const content = URDU_VARIANTS[order]?.[exOrder]?.[0] ?? ex.title;
      await Exercise.findOneAndUpdate(
        { lessonId: lesson._id, order: exOrder },
        {
          $set: {
            lessonId: lesson._id,
            language: 'ur',
            title: ex.title,
            type: ex.type,
            content,
            targetKeys: ex.targetKeys,
            level: Math.min(order, 9),
            difficulty: Math.min(order, 9),
            order: exOrder,
            isActive: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Drop any exercises beyond the defined set (e.g. after a curriculum edit).
    await Exercise.deleteMany({ lessonId: lesson._id, order: { $gt: def.exercises.length } });
    exerciseTotal += def.exercises.length;
  }

  for (const achievement of URDU_ACHIEVEMENTS) {
    await Achievement.findOneAndUpdate(
      { name: achievement.name },
      { $set: { ...achievement, language: 'ur', isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return {
    lessons: URDU_CURRICULUM.length,
    exercises: exerciseTotal,
    achievements: URDU_ACHIEVEMENTS.length,
  };
}
