import {
  urduPassages,
  urduCategoryKey,
  type UrduCategory,
  type UrduDifficulty,
  type UrduDuration,
  type UrduPassage,
} from '../data/urduPassages';
import { normalizeUrdu } from './urduPhonetic';

/** localStorage key holding recently shown passage ids, bucketed per category. */
export const URDU_HISTORY_KEY = 'typeoye:urdu:recent-passage-ids';

/** One list of ids per `${difficulty}-${duration}` category. */
type HistoryBuckets = Record<string, string[]>;

const DIFFICULTIES: readonly UrduDifficulty[] = ['easy', 'medium', 'hard'];
const DURATIONS: readonly UrduDuration[] = [1, 2, 5];

/**
 * Passage id -> its category key, so shown ids can be bucketed. Looked up
 * against the live bank (rather than a map snapshotted at import) so ids for
 * passages published by admins after load are found too.
 */
function categoryById(id: string): UrduCategory | undefined {
  const passage = urduPassages.find((p) => p.id === id);
  return passage ? urduCategoryKey(passage.difficulty, passage.duration) : undefined;
}

/** Every category a session might belong to. */
const ALL_CATEGORIES: readonly UrduCategory[] = DIFFICULTIES.flatMap((difficulty) =>
  DURATIONS.map((duration) => urduCategoryKey(difficulty, duration)),
);

/** A category's history remembers every passage it owns, so recycling is oldest-first. */
function categorySize(difficulty: UrduDifficulty, duration: UrduDuration): number {
  return urduPassages.reduce(
    (n, p) => (p.difficulty === difficulty && p.duration === duration ? n + 1 : n),
    0,
  );
}

function emptyBuckets(): HistoryBuckets {
  const buckets: HistoryBuckets = {};
  for (const category of ALL_CATEGORIES) buckets[category] = [];
  return buckets;
}

/** Per-session text generator: hands out text that never repeats within the session. */
export interface UrduTextSource {
  /** Long normalized text for the first screen of the test. */
  readonly initialText: string;
  /** Next batch of text that has not been shown yet this session ('' when the pool is exhausted). */
  nextText(): string;
  /** Passage ids consumed so far in this session. */
  usedPassageIds(): string[];
  /**
   * True once this session has started reusing passages that were already shown
   * in an earlier session, i.e. this category's fresh pool is used up. When this
   * is true there is no more never-before-seen content for the chosen
   * difficulty and duration.
   */
  isRecycling(): boolean;
  /** How many never-before-seen passages this session can still offer. */
  freshRemaining(): number;
}

function readHistory(): HistoryBuckets {
  const buckets = emptyBuckets();
  if (typeof window === 'undefined') return buckets;
  try {
    const raw = window.localStorage.getItem(URDU_HISTORY_KEY);
    if (!raw) return buckets;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return buckets;
    const record = parsed as Record<string, unknown>;
    for (const category of ALL_CATEGORIES) {
      const list = record[category];
      if (Array.isArray(list)) {
        buckets[category] = list.filter((id): id is string => typeof id === 'string');
      }
    }
    return buckets;
  } catch {
    return buckets;
  }
}

function writeHistory(buckets: HistoryBuckets): void {
  if (typeof window === 'undefined') return;
  try {
    const capped: HistoryBuckets = {};
    for (const category of ALL_CATEGORIES) {
      const [difficulty, duration] = category.split('-') as [UrduDifficulty, UrduDuration];
      capped[category] = (buckets[category] ?? []).slice(-categorySize(difficulty, Number(duration) as UrduDuration));
    }
    window.localStorage.setItem(URDU_HISTORY_KEY, JSON.stringify(capped));
  } catch {
    /* storage unavailable (private mode / quota) — selection still works per-session */
  }
}

/**
 * Remember passages that have been shown, most-recent last. Idempotent: passing
 * the same ids again simply refreshes their position. History is kept per
 * (difficulty, duration) category so one mode never displaces another's memory.
 */
export function recordShownPassages(ids: readonly string[]): void {
  if (ids.length === 0) return;
  const buckets = readHistory();
  for (const id of ids) {
    const category = categoryById(id);
    if (!category) continue;
    const list = buckets[category];
    const at = list.indexOf(id);
    if (at !== -1) list.splice(at, 1);
    list.push(id);
  }
  writeHistory(buckets);
}

/** Forget which passages were recently shown (used by tests). */
export function clearPassageHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(URDU_HISTORY_KEY);
  } catch {
    /* ignore */
  }
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

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Order every passage a session may offer, staying strictly within the chosen
 * (difficulty, duration) category. Fresh (never-shown) passages come first in
 * random order; once the fresh pool is used up, this category's already-seen
 * passages follow in the order they were originally shown (oldest first) so
 * recycling is fair. A category is never silently supplemented from another.
 */
function buildSessionOrder(difficulty: UrduDifficulty, duration: UrduDuration): UrduPassage[] {
  const category = urduCategoryKey(difficulty, duration);
  const history = readHistory()[category];
  const seen = new Set(history);
  const same = urduPassages.filter((p) => p.difficulty === difficulty && p.duration === duration);
  const unseen = shuffle(same.filter((p) => !seen.has(p.id)));
  const recycled = history
    .map((id) => same.find((p) => p.id === id))
    .filter((p): p is UrduPassage => Boolean(p));
  return [...unseen, ...recycled];
}

/** Words to show up front, scaled to the test duration. */
const DEFAULT_INITIAL_WORDS: Record<UrduDuration, number> = { 1: 150, 2: 220, 5: 300 };
/** Words appended whenever the visible text is running low, scaled to the duration. */
const DEFAULT_CHUNK_WORDS: Record<UrduDuration, number> = { 1: 130, 2: 170, 5: 220 };

/**
 * Create the text source for one test session. Every batch is drawn from
 * passages of exactly the chosen difficulty AND duration that the session has
 * not used yet, so text never repeats within the session and a 1-minute easy
 * test can never receive 5-minute hard text. Passages actually handed out are
 * returned by `usedPassageIds()` so the caller can persist them as "recently
 * seen" for future sessions.
 */
export function createUrduTextSource(
  difficulty: UrduDifficulty,
  duration: UrduDuration,
  options: { initialWords?: number; chunkWords?: number } = {},
): UrduTextSource {
  const initialWords = options.initialWords ?? DEFAULT_INITIAL_WORDS[duration];
  const chunkWords = options.chunkWords ?? DEFAULT_CHUNK_WORDS[duration];

  const category = urduCategoryKey(difficulty, duration);
  const previouslySeen = new Set(readHistory()[category]);
  const order = buildSessionOrder(difficulty, duration);
  const sameCategory = urduPassages.filter(
    (p) => p.difficulty === difficulty && p.duration === duration,
  );
  // Safety net: if the category were empty, there is nothing safe to fall back to.
  const queue = order.length > 0 ? order : shuffle(sameCategory);

  let cursor = 0;
  let recycling = false;
  const used: string[] = [];

  const take = (): UrduPassage | null => {
    while (cursor < queue.length) {
      const passage = queue[cursor];
      cursor += 1;
      if (used.includes(passage.id)) continue;
      used.push(passage.id);
      if (previouslySeen.has(passage.id)) recycling = true;
      return passage;
    }
    return null;
  };

  const buildBatch = (minWords: number): string => {
    const parts: string[] = [];
    let words = 0;
    while (words < minWords) {
      const passage = take();
      if (!passage) break;
      parts.push(passage.text);
      words += wordCount(passage.text);
    }
    return parts.length > 0 ? normalizeUrdu(parts.join(' ')) : '';
  };

  const freshRemaining = (): number => {
    let count = 0;
    for (const passage of queue) {
      if (!used.includes(passage.id) && !previouslySeen.has(passage.id)) count += 1;
    }
    return count;
  };

  return {
    initialText: buildBatch(initialWords),
    nextText: () => buildBatch(chunkWords),
    usedPassageIds: () => used.slice(),
    isRecycling: () => recycling,
    freshRemaining,
  };
}
