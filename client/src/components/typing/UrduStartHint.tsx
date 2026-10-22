import React from 'react';

interface UrduStartHintProps {
  /** Positioning classes applied by the parent (e.g. `top-0 right-0`). */
  className?: string;
}

/**
 * RTL Urdu "start typing" instruction shown before the user begins. Mirrors the
 * English pill: a solid accent speech bubble with a small pointer, pinned above
 * the first (right-most) word of the passage. It uses the app's Urdu Nastaliq
 * font (`font-urdu`) with extra line-height so the tall cursive glyphs are never
 * clipped, and the parent reserves top padding so it is never hidden behind the
 * passage. The parent unmounts it as soon as the first character is typed.
 */
export function UrduStartHint({ className = '' }: UrduStartHintProps) {
  return (
    <div
      data-testid="urdu-start-hint"
      aria-hidden
      dir="rtl"
      className={`pointer-events-none absolute z-20 select-none ${className}`}
    >
      <div className="hint-in flex flex-col items-start leading-none">
        <span className="font-urdu whitespace-nowrap rounded-full bg-[var(--color-accent)] px-3.5 py-1 text-sm font-semibold leading-[1.9] text-white shadow-md">
          ٹائپنگ شروع کریں
        </span>
        <span className="mr-[1.125rem] h-0 w-0 border-x-[0.3125rem] border-t-[0.375rem] border-x-transparent border-t-[var(--color-accent)]" />
      </div>
    </div>
  );
}
