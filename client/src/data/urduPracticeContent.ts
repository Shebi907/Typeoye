import { passagesByDifficulty } from './urduPassages';
import { normalizeUrdu } from '../utils/urduPhonetic';
import type { UrduDifficulty, UrduPassage } from './urduPassageTypes';

/**
 * Content bank for the Urdu Practice module.
 *
 * The category axis (characters / combinations / words / sentences /
 * paragraphs) is independent of the typing-test axis, so practice has its own
 * curated pools. To keep quality high and guarantee every target is typeable,
 * the Words and Sentences pools are DERIVED from the vetted typing-test passage
 * bank (`urduContent/*`) rather than hand-typed: those passages are already
 * original, grammatically correct and written only with characters the Urdu
 * phonetic keyboard can produce. Characters and Combinations are curated by
 * hand because they are drills, not prose.
 *
 * Everything below is difficulty-tiered. The generator then varies the stream
 * again by duration (see `urduPracticeGenerator`), so a 1-minute Easy session
 * and a 4-minute Easy session do not receive the same material.
 */

const DIFFICULTIES: readonly UrduDifficulty[] = ['easy', 'medium', 'hard'];

/** Keep first occurrence order while removing duplicates. */
function uniquePreserveOrder(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

/** Urdu sentence terminators + commas stripped when splitting prose into tokens. */
const URDU_PUNCTUATION = /[۔،؟؛:"'()[\]{}<>!٫.,،]+/g;

/** One natural sentence per entry, terminated with the Urdu full stop. */
function deriveSentences(difficulty: UrduDifficulty): string[] {
  const out: string[] = [];
  for (const passage of passagesByDifficulty(difficulty)) {
    for (const part of passage.text.split('۔')) {
      const sentence = normalizeUrdu(part.trim());
      if (sentence) out.push(`${sentence}۔`);
    }
  }
  return uniquePreserveOrder(out);
}

/** Unique standalone words (length >= 2), punctuation removed. */
function deriveWords(difficulty: UrduDifficulty): string[] {
  const out: string[] = [];
  for (const passage of passagesByDifficulty(difficulty)) {
    const cleaned = normalizeUrdu(passage.text.replace(URDU_PUNCTUATION, ' '));
    for (const raw of cleaned.split(/\s+/)) {
      const word = normalizeUrdu(raw);
      if (word.length >= 2 && /\S/.test(word)) out.push(word);
    }
  }
  return uniquePreserveOrder(out);
}

/** Letters the phonetic keyboard can actually produce, tiered by coverage. */
const BASE_CHARACTERS: Record<UrduDifficulty, string[]> = {
  easy: ['ا', 'ب', 'پ', 'ت', 'ج', 'د', 'ر', 'س', 'ک', 'م', 'ن', 'و', 'ہ', 'ی'],
  medium: [
    'ا', 'ب', 'پ', 'ت', 'ٹ', 'ج', 'چ', 'د', 'ڈ', 'ر', 'ز', 'س', 'ش', 'ک', 'گ',
    'ل', 'م', 'ن', 'ں', 'و', 'ہ', 'ی', 'ے', 'ف', 'ق', 'ع',
  ],
  hard: [
    'ا', 'آ', 'ب', 'پ', 'ت', 'ٹ', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ڈ', 'ذ', 'ر',
    'ڑ', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ',
    'ل', 'م', 'ن', 'ں', 'و', 'ہ', 'ھ', 'ء', 'ئ', 'ی', 'ۃ', 'ے',
  ],
};

/**
 * Hand-curated letter combinations. Easy is the everyday consonant + short
 * vowel pairs; Medium adds the aspirated (two-part) letters; Hard mixes
 * aspirated onsets with the long-vowel endings they commonly precede.
 */
const BASE_COMBINATIONS: Record<UrduDifficulty, string[]> = {
  easy: [
    'با', 'بہ', 'پا', 'پہ', 'تا', 'تہ', 'جا', 'جہ', 'دا', 'را', 'سا', 'شا',
    'کا', 'کہ', 'لا', 'ما', 'نا', 'وا', 'ہا', 'یا', 'یہ', 'نے', 'سے', 'کے',
  ],
  medium: [
    'بھا', 'پھا', 'تھا', 'ٹھا', 'جھا', 'چھا', 'دھا', 'ڈھا', 'کھا', 'گھا',
    'بھی', 'تھی', 'دھی', 'کھی', 'چلی', 'گلی', 'کلی', 'ملک', 'دلک',
    'رہا', 'رہی', 'رہے', 'گیا', 'دیا', 'لیا', 'نیا',
  ],
  hard: [
    'بھر', 'پھر', 'تھر', 'جھر', 'چھر', 'دھر', 'کھر', 'گھر',
    'بھی', 'تھی', 'دھی', 'کھی', 'سکی', 'سکا', 'ملا', 'ملی', 'ملو',
    'کری', 'کرا', 'درو', 'پرو', 'جلو', 'چلو', 'بھو', 'تھو', 'کھو',
  ],
};

/** Unique words per difficulty, derived from the passage bank. */
const BASE_WORDS: Record<UrduDifficulty, string[]> = {
  easy: deriveWords('easy'),
  medium: deriveWords('medium'),
  hard: deriveWords('hard'),
};

/** Natural sentences per difficulty, derived from the passage bank. */
const BASE_SENTENCES: Record<UrduDifficulty, string[]> = {
  easy: deriveSentences('easy'),
  medium: deriveSentences('medium'),
  hard: deriveSentences('hard'),
};

/** Paragraphs reuse the vetted passage bank for the difficulty. */
const BASE_PARAGRAPHS: Record<UrduDifficulty, UrduPassage[]> = {
  easy: passagesByDifficulty('easy'),
  medium: passagesByDifficulty('medium'),
  hard: passagesByDifficulty('hard'),
};

/** Exported for tests/diagnostics. */
export const URDU_PRACTICE_DIFFICULTIES = DIFFICULTIES;

// ── Live pools (bundled content + admin-published content) ────────────────────
//
// These are the arrays the practice generator reads. They are cloned from the
// bundled base above and mutated in place by `setAdminUrduPracticeContent`, so
// consumers that imported them always see the current pool. The bundled text is
// always the floor — admin items are appended, never replace it.

function cloneStrings(base: Record<UrduDifficulty, string[]>): Record<UrduDifficulty, string[]> {
  return { easy: [...base.easy], medium: [...base.medium], hard: [...base.hard] };
}

function cloneParagraphs(
  base: Record<UrduDifficulty, UrduPassage[]>,
): Record<UrduDifficulty, UrduPassage[]> {
  return { easy: [...base.easy], medium: [...base.medium], hard: [...base.hard] };
}

export const URDU_PRACTICE_CHARACTERS: Record<UrduDifficulty, string[]> = cloneStrings(BASE_CHARACTERS);
export const URDU_PRACTICE_COMBINATIONS: Record<UrduDifficulty, string[]> = cloneStrings(BASE_COMBINATIONS);
export const URDU_PRACTICE_WORDS: Record<UrduDifficulty, string[]> = cloneStrings(BASE_WORDS);
export const URDU_PRACTICE_SENTENCES: Record<UrduDifficulty, string[]> = cloneStrings(BASE_SENTENCES);
export const URDU_PRACTICE_PARAGRAPHS: Record<UrduDifficulty, UrduPassage[]> = cloneParagraphs(BASE_PARAGRAPHS);

/** Practice categories that have an admin-managed pool ("custom" has none). */
export type ManagedUrduPracticeCategory =
  | 'characters'
  | 'combinations'
  | 'words'
  | 'sentences'
  | 'paragraphs';

/** One admin-published practice item, already normalised by the sync layer. */
export interface AdminUrduPracticeContent {
  category: ManagedUrduPracticeCategory;
  difficulty: UrduDifficulty;
  id: string;
  text: string;
}

function uniqueStrings(base: string[], extra: string[]): string[] {
  const seen = new Set(base);
  const out = [...base];
  for (const value of extra) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

function stringsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

function replaceStrings(target: string[], next: string[]): boolean {
  if (stringsEqual(target, next)) return false;
  target.length = 0;
  target.push(...next);
  return true;
}

function paragraphsEqual(a: UrduPassage[], b: UrduPassage[]): boolean {
  return a.length === b.length && a.every((p, i) => p.id === b[i].id && p.text === b[i].text);
}

/**
 * Replace the admin-published layer of every managed practice pool. Returns
 * true when any pool actually changed so callers can decide whether to rebuild
 * an in-progress selection. Passing an empty list restores the bundled pools.
 */
export function setAdminUrduPracticeContent(items: AdminUrduPracticeContent[]): boolean {
  const textsFor = (category: ManagedUrduPracticeCategory, difficulty: UrduDifficulty): string[] =>
    items.filter((i) => i.category === category && i.difficulty === difficulty).map((i) => i.text);

  let changed = false;

  for (const difficulty of DIFFICULTIES) {
    changed =
      replaceStrings(
        URDU_PRACTICE_CHARACTERS[difficulty],
        uniqueStrings(BASE_CHARACTERS[difficulty], textsFor('characters', difficulty)),
      ) || changed;
    changed =
      replaceStrings(
        URDU_PRACTICE_COMBINATIONS[difficulty],
        uniqueStrings(BASE_COMBINATIONS[difficulty], textsFor('combinations', difficulty)),
      ) || changed;
    changed =
      replaceStrings(
        URDU_PRACTICE_WORDS[difficulty],
        uniqueStrings(BASE_WORDS[difficulty], textsFor('words', difficulty)),
      ) || changed;
    changed =
      replaceStrings(
        URDU_PRACTICE_SENTENCES[difficulty],
        uniqueStrings(BASE_SENTENCES[difficulty], textsFor('sentences', difficulty)),
      ) || changed;

    const adminParagraphs: UrduPassage[] = items
      .filter((i) => i.category === 'paragraphs' && i.difficulty === difficulty)
      .map((i) => ({ id: i.id, difficulty: i.difficulty, duration: 1 as const, text: i.text }));
    const nextParagraphs = [...BASE_PARAGRAPHS[difficulty], ...adminParagraphs];
    if (!paragraphsEqual(URDU_PRACTICE_PARAGRAPHS[difficulty], nextParagraphs)) {
      const target = URDU_PRACTICE_PARAGRAPHS[difficulty];
      target.length = 0;
      target.push(...nextParagraphs);
      changed = true;
    }
  }

  return changed;
}
