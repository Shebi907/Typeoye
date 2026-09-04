// Presentation mirror of the server's authoritative level tiers.
// The server remains the source of truth (level + title are computed there);
// this only drives the progress bar rendering on the client.
export interface LevelTier {
  level: number;
  title: string;
  xpRequired: number;
}

export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, title: 'Typing Beginner', xpRequired: 0 },
  { level: 2, title: 'Typing Learner', xpRequired: 100 },
  { level: 3, title: 'Typing Apprentice', xpRequired: 250 },
  { level: 4, title: 'Typing Pro', xpRequired: 450 },
  { level: 5, title: 'Typing Expert', xpRequired: 700 },
  { level: 6, title: 'Keyboard Master', xpRequired: 1000 },
];

export function levelProgress(totalXP: number, level: number): {
  title: string;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNext: number;
  pct: number;
  isMaxLevel: boolean;
  nextTitle: string | null;
} {
  const current = LEVEL_TIERS.find((t) => t.level === level) ?? LEVEL_TIERS[0];
  const next = LEVEL_TIERS.find((t) => t.level === level + 1) ?? null;

  const xpForLevel = next ? next.xpRequired - current.xpRequired : 0;
  const xpIntoLevel = Math.max(0, totalXP - current.xpRequired);
  const pct = next ? Math.min(100, (xpIntoLevel / xpForLevel) * 100) : 100;

  return {
    title: current.title,
    xpIntoLevel: Math.min(xpIntoLevel, xpForLevel),
    xpForLevel,
    xpToNext: next ? Math.max(0, next.xpRequired - totalXP) : 0,
    pct,
    isMaxLevel: !next,
    nextTitle: next?.title ?? null,
  };
}