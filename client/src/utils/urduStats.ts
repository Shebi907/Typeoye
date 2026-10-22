import type { WordState } from '../types';
import { normalizeUrdu } from './urduPhonetic';

/**
 * The plain, serialisable shape of a finished Urdu session. All values are
 * computed once and then frozen so the result card can never drift while it is
 * on screen.
 */
export interface UrduSession {
  wpm: number;
  accuracy: number;
  correctWords: number;
  incorrectWords: number;
  matchedChars: number;
  attemptedChars: number;
  elapsedSeconds: number;
}

/**
 * Split a string into user-perceived Urdu characters using Unicode code points
 * (never UTF-16 code units). All Urdu letters currently used are in the BMP, so
 * this matches `Array.from` segmentation while staying explicit about intent.
 */
export function urduChars(input: string): string[] {
  return Array.from(input);
}

/** Normalise both sides, then compare with the exact same rule everywhere. */
export function urduWordsMatch(reference: string, typed: string): boolean {
  return normalizeUrdu(typed) === normalizeUrdu(reference);
}

/**
 * Word tally that never counts an unfinished word as an error:
 *  - committed `correct` / `error` words are counted directly;
 *  - the trailing `active` word counts as correct only when it is completely,
 *    correctly typed;
 *  - a partially typed `active` word is ignored for word stats (its characters
 *    are still measured by the character-accuracy pass below).
 */
export function countUrduWords(words: WordState[]): { correct: number; incorrect: number } {
  let correct = 0;
  let incorrect = 0;
  for (const w of words) {
    if (w.status === 'correct') correct += 1;
    else if (w.status === 'error') incorrect += 1;
    else if (w.status === 'active' && w.typed.length > 0 && urduWordsMatch(w.word, w.typed)) correct += 1;
  }
  return { correct, incorrect };
}

/**
 * Character-level tally. For every typed position we add one attempt; it counts
 * as a match when the same position in the reference word holds the same code
 * point. Extra characters past the reference length count as attempts but can
 * never match, so overshooting lowers accuracy instead of being ignored.
 */
export function countUrduChars(words: WordState[]): { matched: number; attempted: number } {
  let matched = 0;
  let attempted = 0;
  for (const w of words) {
    const typed = urduChars(normalizeUrdu(w.typed));
    if (typed.length === 0) continue;
    const ref = urduChars(normalizeUrdu(w.word));
    for (let i = 0; i < typed.length; i += 1) {
      attempted += 1;
      if (i < ref.length && typed[i] === ref[i]) matched += 1;
    }
  }
  return { matched, attempted };
}

/** (correct words / elapsed seconds) × 60, rounded. Guards against divide-by-0. */
export function computeUrduWpm(correctWords: number, elapsedSeconds: number): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 0;
  const wpm = (correctWords / elapsedSeconds) * 60;
  return Number.isFinite(wpm) ? Math.round(wpm) : 0;
}

/** Matched / attempted characters as a percentage, one decimal place, 0 when nothing was typed. */
export function computeUrduAccuracy(matchedChars: number, attemptedChars: number): number {
  if (!Number.isFinite(attemptedChars) || attemptedChars <= 0) return 0;
  const accuracy = (matchedChars / attemptedChars) * 100;
  return Number.isFinite(accuracy) ? Math.round(accuracy * 10) / 10 : 0;
}

/**
 * Compute a whole session from the engine's word states. Used for BOTH the live
 * sidebar and the frozen final card so the two can never disagree.
 */
export function computeUrduSession(words: WordState[], elapsedSeconds: number): UrduSession {
  const { correct, incorrect } = countUrduWords(words);
  const { matched, attempted } = countUrduChars(words);
  return {
    wpm: computeUrduWpm(correct, elapsedSeconds),
    accuracy: computeUrduAccuracy(matched, attempted),
    correctWords: correct,
    incorrectWords: incorrect,
    matchedChars: matched,
    attemptedChars: attempted,
    elapsedSeconds: Number.isFinite(elapsedSeconds) && elapsedSeconds > 0 ? elapsedSeconds : 0,
  };
}
