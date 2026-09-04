export function getLevelTitle(level: number): string {
  if (level >= 50) return 'Keyboard Master';
  if (level >= 30) return 'Typing Expert';
  if (level >= 20) return 'Typing Pro';
  if (level >= 10) return 'Typing Apprentice';
  if (level >= 5) return 'Typing Learner';
  return 'Typing Beginner';
}

export function calculateLevelFromXP(totalXP: number): { level: number; title: string; currentXP: number; nextLevelXP: number } {
  let level = 1;
  let xpNeeded = 500;
  let remainingXP = totalXP;
  while (remainingXP >= xpNeeded) {
    remainingXP -= xpNeeded;
    level++;
    xpNeeded += 100;
  }
  return {
    level,
    title: getLevelTitle(level),
    currentXP: remainingXP,
    nextLevelXP: xpNeeded,
  };
}

export interface TypedWord {
  word: string;
  typed: string;
  correct: boolean;
  timeTakenMs: number;
}

export interface ComputedStats {
  wpm: number;
  accuracy: number;
  correctWords: number;
  attemptedWords: number;
  errorsCount: number;
}

/**
 * AUTHORITATIVE WPM COMPUTATION
 * WPM = correctWords / (durationSeconds / 60)
 * Accuracy = (correctWords / attemptedWords) * 100
 *
 * Test cases (all must pass):
 *   52 correct / 60s  => 52 WPM
 *   67 correct / 60s  => 67 WPM  (3 incorrect don't affect WPM)
 *   30 correct / 30s  => 60 WPM
 *  100 correct / 120s => 50 WPM
 */
export function computeStats(typedWords: TypedWord[], durationSeconds: number): ComputedStats {
  const attemptedWords = typedWords.length;
  // Raw expected and typed values are authoritative; the browser flag is ignored.
  const correctWords = typedWords.filter((w) => w.word === w.typed).length;
  const errorsCount = attemptedWords - correctWords;

  const timeInMinutes = durationSeconds / 60;
  const wpm = timeInMinutes > 0 ? Math.round(correctWords / timeInMinutes) : 0;

  const accuracy =
    attemptedWords > 0 ? Math.round((correctWords / attemptedWords) * 1000) / 10 : 0;

  return { wpm, accuracy, correctWords, attemptedWords, errorsCount };
}

/**
 * Compute per-character weak key data by comparing expected vs typed strings.
 * Returns a map of { key -> { errors, attempts } }
 */
export function computeWeakKeys(
  typedWords: TypedWord[]
): Map<string, { errors: number; attempts: number }> {
  const keyMap = new Map<string, { errors: number; attempts: number }>();

  for (const { word, typed } of typedWords) {
    const maxLen = Math.max(word.length, typed.length);
    for (let i = 0; i < maxLen; i++) {
      const expectedChar = word[i];
      const typedChar = typed[i];

      if (!expectedChar) continue; // extra chars beyond word length — skip

      const existing = keyMap.get(expectedChar) ?? { errors: 0, attempts: 0 };
      existing.attempts += 1;
      if (typedChar !== expectedChar) {
        existing.errors += 1;
      }
      keyMap.set(expectedChar, existing);
    }
  }

  return keyMap;
}
