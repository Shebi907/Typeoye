import React from 'react';
import type { TypingPhase } from '../../types';

interface LiveStatsSidebarProps {
  wpm: number;
  accuracy: number;
  remaining: number;
  elapsed: number;
  phase: TypingPhase;
  duration: number;
}

/**
 * Right-hand sidebar card with live WPM / Seconds Left / Accuracy, stacked
 * vertically with dividers. Pure display — values are computed by the typing
 * engine exactly as before.
 */
export function LiveStatsSidebar({ wpm, accuracy, remaining, elapsed, phase, duration }: LiveStatsSidebarProps) {
  const timeDisplay = phase === 'idle' ? `${duration}` : `${Math.ceil(remaining)}`;
  const progressPct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const timeCritical = remaining <= 10 && phase === 'running';

  return (
    <div
      className="card p-4 w-full rounded-xl border-[0.5px]"
      role="status"
      aria-label="Typing statistics"
      aria-live="polite"
      data-testid="stats-sidebar"
    >
      {/* WPM */}
      <div className="text-center py-3">
        <div
          className="text-[30px] leading-none font-bold tabular-nums"
          style={{ color: 'var(--color-accent-text)' }}
        >
          {phase === 'idle' ? '—' : wpm}
        </div>
        <div className="text-[10px] font-semibold mt-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          WPM
        </div>
      </div>

      <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

      {/* Seconds left */}
      <div className="text-center py-3">
        <div
          className={`text-[34px] leading-none font-bold tabular-nums ${timeCritical ? 'text-[var(--color-error)]' : ''}`}
          style={timeCritical ? undefined : { color: 'var(--color-text-primary)' }}
        >
          {timeDisplay}
        </div>
        <div className="text-[10px] font-semibold mt-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Seconds left
        </div>
      </div>

      <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

      {/* Accuracy */}
      <div className="text-center pt-3 pb-1.5">
        <div
          className="text-[30px] leading-none font-bold tabular-nums"
          style={{ color: 'var(--color-correct)' }}
        >
          {phase === 'idle' ? '—' : `${accuracy.toFixed(0)}%`}
        </div>
        <div className="text-[10px] font-semibold mt-1.5 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Accuracy
        </div>
      </div>

      {/* Progress strip */}
      <div className="h-1 rounded-full overflow-hidden mt-2" style={{ backgroundColor: 'var(--color-border)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progressPct}%`,
            backgroundColor: timeCritical ? 'var(--color-error)' : 'var(--color-accent)',
          }}
        />
      </div>
    </div>
  );
}
