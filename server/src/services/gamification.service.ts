import mongoose from 'mongoose';
import Profile, { IProfile } from '../models/Profile';
import { ComputedStats } from './wpm.service';

/**
 * AUTHORITATIVE GAMIFICATION LAYER
 *
 * XP totals, level, and level title are always derived server-side from real,
 * stored activity. The client never submits or claims XP — it only receives the
 * results of actions the server itself validated and saved.
 */

export interface LevelTier {
  level: number;
  title: string;
  xpRequired: number;
}

// Increasing XP gaps between tiers: 100 / 150 / 200 / 250 / 300
export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, title: 'Typing Beginner', xpRequired: 0 },
  { level: 2, title: 'Typing Learner', xpRequired: 100 },
  { level: 3, title: 'Typing Apprentice', xpRequired: 250 },
  { level: 4, title: 'Typing Pro', xpRequired: 450 },
  { level: 5, title: 'Typing Expert', xpRequired: 700 },
  { level: 6, title: 'Keyboard Master', xpRequired: 1000 },
];

export const MAX_LEVEL = LEVEL_TIERS[LEVEL_TIERS.length - 1];

export interface LevelInfo {
  level: number;
  title: string;
  totalXP: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNext: number;
  nextTitle: string | null;
  progressPct: number;
  isMaxLevel: boolean;
}

export function deriveLevelFromXp(totalXP: number): LevelInfo {
  let level = LEVEL_TIERS[0].level;
  let title = LEVEL_TIERS[0].title;

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_TIERS[i].xpRequired) {
      level = LEVEL_TIERS[i].level;
      title = LEVEL_TIERS[i].title;
      break;
    }
  }

  const current = LEVEL_TIERS.find((t) => t.level === level)!;
  const next = LEVEL_TIERS.find((t) => t.level === level + 1) ?? null;

  const xpIntoLevel = totalXP - current.xpRequired;
  const xpForLevel = next ? next.xpRequired - current.xpRequired : 0;
  const xpToNext = next ? Math.max(0, next.xpRequired - totalXP) : 0;
  const progressPct = next ? Math.min(100, (xpIntoLevel / xpForLevel) * 100) : 100;

  return {
    level,
    title,
    totalXP,
    xpIntoLevel,
    xpForLevel,
    xpToNext,
    nextTitle: next?.title ?? null,
    progressPct,
    isMaxLevel: !next,
  };
}

// Base XP granted for a completed, server-verified session.
export const XP_VALUES = {
  testComplete: 20,
  practiceComplete: 10,
  gameComplete: 10,
  lessonExercisePassed: 10,
  lessonCompleteBonus: 40,
  personalBestBonus: 15,
  perfectAccuracyBonus: 25,
  highAccuracyBonus: 10, // 95% <= accuracy < 100%
  dailyActivityBonus: 10, // first qualifying activity on a calendar day
} as const;

export interface SessionAward {
  mode: 'test' | 'practice' | 'lesson' | 'game';
  stats: ComputedStats;
  isPersonalBest: boolean;
  isFirstActivityToday: boolean;
}

export interface AwardResult {
  xpEarned: number;
  prevXP: number;
  newXP: number;
  prevLevel: number;
  newLevel: number;
  leveledUp: boolean;
  levelTitle: string;
  breakdown: { label: string; value: number }[];
}

/**
 * Compute the XP earned for a completed typing session (test / practice / game).
 * Pure — does not persist anything.
 */
export function computeSessionXp(input: SessionAward): { total: number; breakdown: { label: string; value: number }[] } {
  const breakdown: { label: string; value: number }[] = [];
  const base =
    input.mode === 'test'
      ? XP_VALUES.testComplete
      : input.mode === 'practice'
        ? XP_VALUES.practiceComplete
        : XP_VALUES.gameComplete;
  if (base > 0) breakdown.push({ label: `${input.mode} complete`, value: base });

  let total = base;

  if (input.isPersonalBest) {
    breakdown.push({ label: 'New personal best', value: XP_VALUES.personalBestBonus });
    total += XP_VALUES.personalBestBonus;
  }

  if (input.stats.accuracy >= 100) {
    breakdown.push({ label: 'Perfect accuracy', value: XP_VALUES.perfectAccuracyBonus });
    total += XP_VALUES.perfectAccuracyBonus;
  } else if (input.stats.accuracy >= 95) {
    breakdown.push({ label: 'High accuracy', value: XP_VALUES.highAccuracyBonus });
    total += XP_VALUES.highAccuracyBonus;
  }

  if (input.isFirstActivityToday) {
    breakdown.push({ label: 'Daily activity', value: XP_VALUES.dailyActivityBonus });
    total += XP_VALUES.dailyActivityBonus;
  }

  return { total, breakdown };
}

/**
 * Atomically add XP to a user's profile and recompute level/title from the
 * authoritative total. Never trusts a client-provided level.
 */
export async function awardXp(
  userId: mongoose.Types.ObjectId | string,
  amount: number
): Promise<AwardResult> {
  const prev = await Profile.findOne({ userId });

  if (!prev) {
    // Registration always creates a Profile; treat absence defensively.
    return {
      xpEarned: amount,
      prevXP: 0,
      newXP: 0,
      prevLevel: 1,
      newLevel: 1,
      leveledUp: false,
      levelTitle: LEVEL_TIERS[0].title,
      breakdown: [],
    };
  }

  const prevXP = prev.totalXP;
  const prevLevel = prev.level;

  const profile = (await Profile.findOneAndUpdate(
    { userId },
    { $inc: { totalXP: amount } },
    { new: true }
  )) as IProfile | null;

  if (!profile) {
    return {
      xpEarned: amount,
      prevXP,
      newXP: prevXP,
      prevLevel,
      newLevel: prevLevel,
      leveledUp: false,
      levelTitle: prev.levelTitle || LEVEL_TIERS[0].title,
      breakdown: [],
    };
  }

  const derived = deriveLevelFromXp(profile.totalXP);
  const leveledUp = derived.level > prevLevel;

  if (profile.level !== derived.level || profile.levelTitle !== derived.title) {
    profile.level = derived.level;
    profile.levelTitle = derived.title;
    await profile.save();
  }

  return {
    xpEarned: amount,
    prevXP,
    newXP: profile.totalXP,
    prevLevel,
    newLevel: derived.level,
    leveledUp,
    levelTitle: derived.title,
    breakdown: [],
  };
}

/**
 * Defensive: make sure a profile's stored level/title match its total XP.
 * Called on login/me so old profiles self-heal and the server stays authoritative.
 */
export async function syncProfileLevel(userId: mongoose.Types.ObjectId | string): Promise<IProfile | null> {
  const profile = await Profile.findOne({ userId });
  if (!profile) return null;

  const derived = deriveLevelFromXp(profile.totalXP);
  if (profile.level !== derived.level || profile.levelTitle !== derived.title) {
    profile.level = derived.level;
    profile.levelTitle = derived.title;
    await profile.save();
  }
  return profile;
}
