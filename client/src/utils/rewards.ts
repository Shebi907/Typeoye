import { useTypingStore } from '../store/typingStore';
import { useAuthStore } from '../store/authStore';
import type { SessionRewards, TypingResult } from '../types';

/**
 * Apply a server-verified rewards payload after a real session is saved:
 * updates the typing store (achievement toasts / level-up modal) and keeps the
 * auth profile's XP/level in sync so the Dashboard reflects the truth.
 */
export function applySessionRewards(result: TypingResult | null, rewards: SessionRewards): void {
  const { newAchievements, xpEarned, leveledUp, level, levelTitle } = rewards;
  useTypingStore.getState().setResult(result, newAchievements, xpEarned, leveledUp, level, levelTitle);

  // Keep the profile authoritative: only ever overwrite with server values.
  const profile = useAuthStore.getState().profile;
  if (profile && typeof rewards.newXP === 'number') {
    useAuthStore.getState().setProfile({
      ...profile,
      totalXP: rewards.newXP,
      level: rewards.level,
      levelTitle: rewards.levelTitle,
    });
  }
}