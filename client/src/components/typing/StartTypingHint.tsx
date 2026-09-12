import React from 'react';

interface StartTypingHintProps {
  /** Tailwind left offset that matches the hosting card's left padding so the
   *  bubble aligns with the first character (e.g. `left-7` for `px-7`, `left-8` for `px-8`). */
  className?: string;
}

export function StartTypingHint({ className = '' }: StartTypingHintProps) {
  return (
    <div
      data-testid="start-typing-hint"
      aria-hidden
      className={`pointer-events-none absolute z-20 select-none ${className}`}
    >
      <div className="hint-in flex flex-col items-start leading-none -translate-y-[100%] -translate-x-[0.375rem] pb-1">
        <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white shadow-md">
          Start typing!
        </span>
        <span className="ml-[1.125rem] h-0 w-0 border-x-[0.3125rem] border-t-[0.375rem] border-x-transparent border-t-[var(--color-accent)]" />
      </div>
    </div>
  );
}