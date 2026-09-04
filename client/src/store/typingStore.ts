import { create } from 'zustand';
import type { TypingResult, Achievement } from '../types';

interface TypingStore {
  lastResult: TypingResult | null;
  newAchievements: Achievement[];
  xpEarned: number;
  leveledUp: boolean;
  level: number;
  levelTitle: string;
  setResult: (
    result: TypingResult | null,
    achievements: Achievement[],
    xpEarned: number,
    leveledUp: boolean,
    level?: number,
    levelTitle?: string
  ) => void;
  clearResult: () => void;
  clearLevelUp: () => void;
}

export const useTypingStore = create<TypingStore>((set) => ({
  lastResult: null,
  newAchievements: [],
  xpEarned: 0,
  leveledUp: false,
  level: 1,
  levelTitle: 'Typing Beginner',

  setResult: (result, newAchievements, xpEarned, leveledUp, level = 1, levelTitle = 'Typing Beginner') =>
    set({ lastResult: result, newAchievements, xpEarned, leveledUp, level, levelTitle }),

  clearResult: () =>
    set({ lastResult: null, newAchievements: [], xpEarned: 0 }),

  clearLevelUp: () => set({ leveledUp: false }),
}));
