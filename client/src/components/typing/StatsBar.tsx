import React from 'react';
import type { TypingPhase } from '../../types';

interface StatsBarProps {
  wpm: number;
  accuracy: number;
  remaining: number;
  elapsed: number;
  phase: TypingPhase;
  duration: number;
}

function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, '0');
}

export function StatsBar({ wpm, accuracy, remaining, elapsed, phase, duration }: StatsBarProps) {
  const timeDisplay =
    phase === 'idle' ? `${duration}` : `${Math.ceil(remaining)}`;

  const progressPct = duration > 0 ? (elapsed / duration) * 100 : 0;

  return (
    <div
      className="w-full mb-6"
      role="status"
      aria-label="Typing statistics"
      aria-live="polite"
    >
      {/* Stats row */}
      <div className="flex items-center justify-center gap-6 sm:gap-12 mb-4">
        {/* WPM */}
        <div className="text-center">
          <div
            className="text-5xl font-bold tabular-nums"
            style={{ color: 'var(--color-accent-text)', fontFamily: 'Inter, sans-serif' }}
          >
            {phase === 'idle' ? '—' : wpm}
          </div>
          <div className="text-xs font-semibold mt-1 uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}>
            WPM
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div
            className="text-5xl font-bold tabular-nums"
            style={{
              color: remaining <= 10 && phase === 'running'
                ? 'var(--color-error)'
                : 'var(--color-text-primary)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {timeDisplay}
          </div>
          <div className="text-xs font-semibold mt-1 uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}>
            {phase === 'idle' ? 'SECONDS' : 'LEFT'}
          </div>
        </div>

        {/* Accuracy */}
        <div className="text-center">
          <div
            className="text-5xl font-bold tabular-nums"
            style={{ color: 'var(--color-correct)', fontFamily: 'Inter, sans-serif' }}
          >
            {phase === 'idle' ? '—' : `${accuracy.toFixed(0)}%`}
          </div>
          <div className="text-xs font-semibold mt-1 uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}>
            ACC
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progressPct}%`,
            backgroundColor: remaining <= 10 && phase === 'running'
              ? 'var(--color-error)'
              : 'var(--color-accent)',
          }}
        />
      </div>
    </div>
  );
}
