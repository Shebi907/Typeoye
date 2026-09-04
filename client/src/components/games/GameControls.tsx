import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * "← Back to Games" — top-left secondary/outline button rendered above the
 * game content. Navigates back to the Games listing (via the onBack callback,
 * no new route).
 */
export function BackToGames({ onBack }: { onBack?: () => void }) {
  return (
    <button
      type="button"
      onClick={() => onBack?.()}
      data-testid="game-back"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:brightness-105 shrink-0"
      style={{
        color: 'var(--color-accent-text)',
        backgroundColor: 'var(--color-accent-light)',
        border: '1px solid var(--color-border)',
      }}
    >
      <ArrowLeft size={15} />
      Back to Games
    </button>
  );
}
