import React from 'react';
import { Gauge, Target, Timer } from 'lucide-react';
import type { TypingPhase } from '../../types';

interface LiveStatsCardProps {
  wpm: number;
  accuracy: number;
  remaining: number;
  elapsed: number;
  phase: TypingPhase;
  duration: number;
}

/**
 * Shared live stats sidebar card — used by both Test and Practice session views.
 * Shows WPM, Accuracy, Time Left with icon rows and a progress bar.
 */
export function LiveStatsCard({ wpm, accuracy, remaining, elapsed, phase, duration }: LiveStatsCardProps) {
  const timeDisplay = `${phase === 'idle' ? duration : Math.ceil(remaining)}s`;
  const progressPct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const timeCritical = remaining <= 10 && phase === 'running';

  const stats = [
    {
      icon: Gauge,
      label: 'WPM',
      value: phase === 'idle' ? '0' : String(wpm),
      tone: { backgroundColor: 'rgba(67, 97, 238, 0.12)', color: '#4361ee' },
      valuecolor: 'var(--color-accent-text)',
    },
    {
      icon: Target,
      label: 'Accuracy',
      value: `${phase === 'idle' ? 100 : accuracy.toFixed(0)}%`,
      tone: { backgroundColor: 'rgba(34, 197, 94, 0.14)', color: '#16a34a' },
      valueColor: 'var(--color-correct)',
    },
    {
      icon: Timer,
      label: 'Time Left',
      value: timeDisplay,
      tone: timeCritical
        ? { backgroundColor: 'rgba(239, 68, 68, 0.14)', color: '#dc2626' }
        : { backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' },
      valueColor: timeCritical ? 'var(--color-error)' : 'var(--color-text-primary)',
    },
  ];

  return (
    <div
      className="card p-4 w-full tt-stats-card"
      role="status"
      aria-label="Typing statistics"
      aria-live="polite"
      data-testid="stats-sidebar"
    >
      <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Live Stats
      </h2>
      <div className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {stats.map(({ icon: Icon, label, value, tone, valueColor }) => (
          <div key={label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={tone}>
                <Icon size={15} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                {label}
              </span>
            </div>
            <b className="text-2xl font-bold tabular-nums leading-none" style={{ color: valueColor }}>
              {value}
            </b>
          </div>
        ))}
      </div>

      {/* Progress strip */}
      <div className="h-1.5 rounded-full overflow-hidden mt-2.5" style={{ backgroundColor: 'var(--color-border)' }}>
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
