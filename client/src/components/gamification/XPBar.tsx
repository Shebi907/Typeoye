import React from 'react';
import { ProgressBar } from '../ui/ProgressBar';
import { levelProgress } from '../../utils/levels';

interface XPBarProps {
  totalXP: number;
  level: number;
}

export function XPBar({ totalXP, level }: XPBarProps) {
  const info = levelProgress(totalXP, level);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            {level}
          </div>
          <div>
            <span className="text-sm font-semibold block" style={{ color: 'var(--color-text-primary)' }}>
              {info.title}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Level {level}
            </span>
          </div>
        </div>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {info.isMaxLevel ? (
            'Max level reached'
          ) : (
            <>
              {info.xpIntoLevel} / {info.xpForLevel} XP
            </>
          )}
        </span>
      </div>
      <ProgressBar value={info.pct} color="accent" size="sm" />
      {!info.isMaxLevel && info.nextTitle && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
          {info.xpToNext} XP to {info.nextTitle}
        </p>
      )}
    </div>
  );
}

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakBadge({ currentStreak, longestStreak }: StreakBadgeProps) {
  return (
    <div
      className="card px-4 py-3 flex items-center gap-3"
      style={{ minWidth: '10rem' }}
    >
      <div className="text-2xl">🔥</div>
      <div>
        <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {currentStreak}
          <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>
            day{currentStreak !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Best: {longestStreak}d
        </div>
      </div>
    </div>
  );
}