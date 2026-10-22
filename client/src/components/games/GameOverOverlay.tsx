import React from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface GameOverOverlayProps {
  /** The game content to show blurred+dimmed behind the overlay */
  children: React.ReactNode;
  /** The centered result card to display on top */
  result: React.ReactNode;
}

/**
 * Shared game-over overlay: keeps the game screen rendered but blurred+dimmed,
 * with a full-viewport fixed backdrop (spanning the whole screen, edge to
 * edge) and a centered result card on top. Also locks page scroll while open.
 */
export default function GameOverOverlay({ children, result }: GameOverOverlayProps) {
  // Mounted only while a game-over overlay is shown, so locking on mount is
  // equivalent to locking on open; cleanup restores page scroll.
  useScrollLock(true);

  return (
    <div className="relative w-full max-w-[53.75rem]">
      {/* 1. Blurred + dimmed game background */}
      <div
        className="w-full pointer-events-none select-none"
        style={{ filter: 'blur(4px)', opacity: 0.45 }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* 2. Full-screen fixed backdrop — covers the entire viewport,
           edge to edge, above the navbar and all page content */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: 'rgba(15, 16, 24, 0.72)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
        aria-hidden="true"
      />

      {/* 3. Centered result card — fixed to the viewport so it is always
           horizontally + vertically centered, at a compact width. The layer
           scrolls internally so a card taller than the viewport (small phones,
           large OS font) stays fully reachable instead of being clipped, since
           useScrollLock freezes the document behind it. */}
      <div
        className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto p-4"
        style={{ paddingTop: 'calc(var(--navbar-h, 4rem) + 1rem)', paddingBottom: '1rem' }}
      >
        <div className="w-full max-w-[25rem] my-auto pointer-events-auto">
          {result}
        </div>
      </div>
    </div>
  );
}