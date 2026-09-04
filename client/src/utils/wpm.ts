import type { TypedWord } from '../types';

/**
 * Client-side preview WPM — same formula as server (authoritative).
 *
 * Literal word count: each word the user typed fully and correctly counts as
 * exactly 1, regardless of character length. Partial or incorrect words do not
 * count. WPM = correctWords / (elapsedSeconds / 60).
 */
export function computeWpm(correctWords: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0;
  return Math.round(correctWords / (elapsedSeconds / 60));
}

export function computeAccuracy(correctWords: number, attemptedWords: number): number {
  if (attemptedWords === 0) return 100;
  return Math.round((correctWords / attemptedWords) * 1000) / 10;
}

export function buildTypedWords(
  wordStates: Array<{
    word: string;
    typed: string;
    status: string;
    startTime?: number;
    timeTakenMs?: number;
  }>
): TypedWord[] {
  return wordStates
    .filter((w) => w.status !== 'pending')
    .map((w) => ({
      word: w.word,
      typed: w.typed,
      correct: w.word === w.typed,
      timeTakenMs: w.timeTakenMs ?? 0,
    }));
}
