import { easyPassages } from './urduContent/easy';
import { hardPassages } from './urduContent/hard';
import { mediumPassages } from './urduContent/medium';
import { urduCategoryKey } from './urduPassageTypes';
import type {
  UrduCategory,
  UrduDifficulty,
  UrduDuration,
  UrduPassage,
} from './urduPassageTypes';

export type { UrduCategory, UrduDifficulty, UrduDuration, UrduPassage };
export { urduCategoryKey };

/**
 * Complete bank of original Urdu passages, split into nine distinct pools — one
 * per difficulty (easy / medium / hard) crossed with one per test duration
 * (1 / 2 / 5 minutes). Filtering on BOTH fields is what makes a one minute easy
 * test draw short, simple text while a five minute hard test draws longer,
 * advanced prose.
 *
 * Every entry is original, natural, grammatically correct Urdu written only
 * with characters the Urdu phonetic keyboard can produce, so any passage can be
 * typed end-to-end. Entries are unique across the whole bank — no passage text
 * and no sentence is shared anywhere — which lets the selector guarantee that
 * text shown during a single session is never repeated.
 *
 * Per-category totals (see `urduContent/*.ts`):
 *   easy   1 min 10 passages, 2 min 8, 5 min 8
 *   medium 1 min 10 passages, 2 min 8, 5 min 8
 *   hard   1 min 10 passages, 2 min 8, 5 min 8
 */
/** The bundled, hand-authored passages — never mutated after module init. */
const STATIC_PASSAGES: UrduPassage[] = [
  ...easyPassages,
  ...mediumPassages,
  ...hardPassages,
];

/**
 * The live passage bank. Kept as a single array instance (mutated in place by
 * `setAdminUrduPassages`) so every consumer that imported it keeps seeing the
 * current contents — static passages plus whichever admin passages are
 * published for this page load.
 */
export const urduPassages: UrduPassage[] = [...STATIC_PASSAGES];

/**
 * Replace the admin-published layer of the bank. Called by the content sync
 * after fetching published passages from the server; passing an empty list
 * simply restores the bundled bank. Returns true when the bank actually changed
 * so callers can decide whether to rebuild an in-progress selection.
 */
export function setAdminUrduPassages(list: UrduPassage[]): boolean {
  const next = [...STATIC_PASSAGES, ...list];
  const unchanged =
    next.length === urduPassages.length &&
    next.every((p, i) => p.id === urduPassages[i]?.id && p.text === urduPassages[i]?.text);
  if (unchanged) return false;
  urduPassages.length = 0;
  urduPassages.push(...next);
  return true;
}

/** All passages for one (difficulty, duration) category, in authoring order. */
export function passagesByCategory(
  difficulty: UrduDifficulty,
  duration: UrduDuration,
): UrduPassage[] {
  return urduPassages.filter((p) => p.difficulty === difficulty && p.duration === duration);
}

/** All passages belonging to one difficulty, across every duration. */
export function passagesByDifficulty(difficulty: UrduDifficulty): UrduPassage[] {
  return urduPassages.filter((p) => p.difficulty === difficulty);
}

/**
 * Pick one random passage for a difficulty. Retained for callers that only need
 * a single passage; the typing test itself uses `createUrduTextSource` so that
 * nothing is repeated across or within sessions.
 */
export function getUrduPassageByDifficulty(difficulty: UrduDifficulty): UrduPassage {
  const list = passagesByDifficulty(difficulty);
  const pool = list.length > 0 ? list : urduPassages;
  return pool[Math.floor(Math.random() * pool.length)];
}
