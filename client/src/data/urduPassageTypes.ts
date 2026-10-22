export type UrduDifficulty = 'easy' | 'medium' | 'hard';

/** Test duration in minutes; each value has its own passage pool. */
export type UrduDuration = 1 | 2 | 5;

export type UrduPassage = {
  id: string;
  difficulty: UrduDifficulty;
  duration: UrduDuration;
  text: string;
};

/** Nine categories: 3 difficulties x 3 durations. */
export type UrduCategory = `${UrduDifficulty}-${UrduDuration}`;

export function urduCategoryKey(
  difficulty: UrduDifficulty,
  duration: UrduDuration,
): UrduCategory {
  return `${difficulty}-${duration}`;
}
