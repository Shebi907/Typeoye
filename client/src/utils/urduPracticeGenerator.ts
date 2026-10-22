import { normalizeUrdu } from './urduPhonetic';
import {
  URDU_PRACTICE_CHARACTERS,
  URDU_PRACTICE_COMBINATIONS,
  URDU_PRACTICE_PARAGRAPHS,
  URDU_PRACTICE_SENTENCES,
  URDU_PRACTICE_WORDS,
} from '../data/urduPracticeContent';
import type { UrduPracticeCategory, UrduPracticeDifficulty } from '../data/urduPracticeTypes';

/** localStorage key holding already-shown practice content, bucketed per category+difficulty. */
export const URDU_PRACTICE_HISTORY_KEY = 'typeoye:urdu:practice-history';

/** Cap each bucket so storage can never grow without bound. */
const HISTORY_CAP = 400;

type Category = UrduPracticeCategory;
type Difficulty = UrduPracticeDifficulty;
type DurationMinutes = 1 | 2 | 5;

export interface UrduPracticeSource {
  /** Text for the first screen (already a comfortable length for the duration). */
  initialText: string;
  /** Next batch of text for the active session ('' only if there is nothing to show). */
  nextText(): string;
  /** True once this session had to reuse previously-shown content. */
  isRecycling(): boolean;
  /** Ids handed out this session, for persistence. Empty for drills/custom. */
  usedIds(): string[];
}

interface Unit {
  id: string;
  text: string;
  /** How many engine "words" (space-separated tokens) this unit contributes. */
  words: number;
}

/** Content categories enforce no-repeat + history; characters/combinations are drills. */
const CONTENT_CATEGORIES: ReadonlySet<Category> = new Set<Category>(['words', 'sentences', 'paragraphs']);

/** Words shown up front, scaled to the practice duration. */
const INITIAL_WORDS: Record<DurationMinutes, number> = { 1: 80, 2: 130, 5: 220 };
/** Words appended whenever the visible text runs low, scaled to the duration. */
const CHUNK_WORDS: Record<DurationMinutes, number> = { 1: 60, 2: 100, 5: 160 };

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function historyKey(category: Category, difficulty: Difficulty): string {
  return `${category}:${difficulty}`;
}

function readHistory(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(URDU_PRACTICE_HISTORY_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(value)) out[key] = value.filter((id): id is string => typeof id === 'string');
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Remember content handed out, most-recent last. Idempotent: re-recording an id
 * only refreshes its position, so the same passage is never counted twice.
 */
export function recordUrduPracticeIds(key: string, ids: readonly string[]): void {
  if (typeof window === 'undefined' || ids.length === 0) return;
  try {
    const history = readHistory();
    const list = history[key] ?? [];
    for (const id of ids) {
      const at = list.indexOf(id);
      if (at !== -1) list.splice(at, 1);
      list.push(id);
    }
    history[key] = list.slice(-HISTORY_CAP);
    window.localStorage.setItem(URDU_PRACTICE_HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* storage unavailable (private mode / quota) — session still works */
  }
}

/** Forget which practice content was recently shown (used by tests). */
export function clearUrduPracticeHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(URDU_PRACTICE_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

/** The history bucket key for a category+difficulty — exposed for the session page. */
export function urduPracticeHistoryKey(category: Category, difficulty: Difficulty): string {
  return historyKey(category, difficulty);
}

/**
 * Repeat a small drill pool into a large shuffled queue. Drills (characters,
 * combinations) are expected to repeat, so ids are made unique per repetition
 * only to keep the within-session bookkeeping honest.
 */
function repeatTokens(pool: readonly string[], kind: string): Unit[] {
  if (pool.length === 0) return [];
  const repeats = Math.max(2, Math.ceil(120 / pool.length));
  const units: Unit[] = [];
  for (let r = 0; r < repeats; r += 1) {
    for (const item of shuffle(pool)) units.push({ id: `${kind}:${item}:${r}`, text: item, words: 1 });
  }
  return units;
}

function buildUnits(category: Category, difficulty: Difficulty): Unit[] {
  if (category === 'characters') return repeatTokens(URDU_PRACTICE_CHARACTERS[difficulty], 'char');
  if (category === 'combinations') return repeatTokens(URDU_PRACTICE_COMBINATIONS[difficulty], 'combo');
  if (category === 'words') {
    return URDU_PRACTICE_WORDS[difficulty].map((word) => ({ id: `word:${word}`, text: word, words: 1 }));
  }
  if (category === 'sentences') {
    return URDU_PRACTICE_SENTENCES[difficulty].map((sentence) => ({
      id: `sent:${sentence}`,
      text: sentence,
      words: wordCount(sentence),
    }));
  }
  return URDU_PRACTICE_PARAGRAPHS[difficulty].map((passage) => ({
    id: passage.id,
    text: passage.text,
    words: wordCount(passage.text),
  }));
}

/**
 * Order the units a session may draw from. Never-shown content comes first;
 * within that set the duration biases the mix (1-minute sessions start with the
 * shortest units, 5-minute sessions with the longest) so duration actually
 * changes what appears, not just the label. Already-shown content follows
 * oldest-first so recycling is fair.
 */
function buildOrder(units: Unit[], history: string[], duration: DurationMinutes, isContent: boolean): Unit[] {
  const seen = new Set(history);
  let fresh = units.filter((unit) => !seen.has(unit.id));
  if (isContent && duration === 1) fresh.sort((a, b) => a.words - b.words);
  else if (isContent && duration === 5) fresh.sort((a, b) => b.words - a.words);
  else fresh = shuffle(fresh);
  const recycled = history
    .map((id) => units.find((unit) => unit.id === id))
    .filter((unit): unit is Unit => Boolean(unit));
  return [...fresh, ...recycled];
}

/**
 * Create the content source for one practice session.
 *
 * - `words` / `sentences` / `paragraphs` draw fresh content first and never
 *   repeat a unit within the session; shown units are reported by `usedIds()`
 *   so future sessions can avoid them.
 * - `characters` / `combinations` are drills — a shuffled pool that repeats.
 * - `custom` uses the user's exact text, repeating it when it runs out (never
 *   substituting a preset passage), matching English custom practice.
 */
export function createUrduPracticeSource(options: {
  category: Category;
  difficulty: Difficulty;
  durationMinutes: DurationMinutes;
  customText?: string;
}): UrduPracticeSource {
  const { category, difficulty, durationMinutes } = options;

  if (category === 'custom') {
    // Custom practice uses exactly what the user pasted. Newlines collapse to
    // spaces so the engine (whitespace tokenised) renders it cleanly.
    const base = normalizeUrdu((options.customText ?? '').replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim());
    return {
      initialText: base,
      nextText: () => base,
      isRecycling: () => false,
      usedIds: () => [],
    };
  }

  const isContent = CONTENT_CATEGORIES.has(category);
  const units = buildUnits(category, difficulty);
  const history = isContent ? (readHistory()[historyKey(category, difficulty)] ?? []) : [];
  const seen = new Set(history);
  let queue = buildOrder(units, history, durationMinutes, isContent);

  const used = new Set<string>();
  let cursor = 0;
  let recycling = false;

  const take = (): Unit | null => {
    while (cursor < queue.length) {
      const unit = queue[cursor];
      cursor += 1;
      if (used.has(unit.id)) continue;
      used.add(unit.id);
      if (seen.has(unit.id)) recycling = true;
      return unit;
    }
    return null;
  };

  const buildBatch = (minWords: number): string => {
    const parts: string[] = [];
    let words = 0;
    let guard = 0;
    while (words < minWords && guard < 6000) {
      guard += 1;
      let unit = take();
      if (!unit) {
        // Whole pool served. Reshuffle and continue with fresh ordering so we
        // never restart from the identical first item. Content reuses are
        // flagged; drills simply loop their pool.
        queue = shuffle(units);
        cursor = 0;
        used.clear();
        if (isContent) recycling = true;
        unit = take();
        if (!unit) break;
      }
      parts.push(unit.text);
      words += unit.words;
    }
    return parts.length > 0 ? normalizeUrdu(parts.join(' ')) : '';
  };

  return {
    initialText: buildBatch(INITIAL_WORDS[durationMinutes]),
    nextText: () => buildBatch(CHUNK_WORDS[durationMinutes]),
    isRecycling: () => recycling,
    usedIds: () => Array.from(used),
  };
}
