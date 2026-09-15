import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import type { WordState } from '../../types';
import { cn } from '../../utils/cn';

interface TypingDisplayProps {
  wordStates: WordState[];
  currentWordIndex: number;
  fontSize?: number;
  /** Unitless line-height multiplier (default 2.4) */
  lineHeight?: number;
}

interface CaretAnchor {
  wordIdx: number;
  charIdx: number;
  /** True when the caret sits after the last character of a fully-typed word. */
  afterChar: boolean;
}

const CARET_FONT = '"JetBrains Mono", "Fira Code", monospace';
const CARET_WIDTH = 3;
const CARET_GAP = 0;
/** Milliseconds of no input before the caret begins its idle blink. Kept tiny so
 *  the blink starts almost immediately after the user pauses, but long enough
 *  that continuous typing (keystrokes < this apart) keeps the bar solid. */
const CARET_IDLE_MS = 350;

/** Font glyph metrics (ascender + descender) for a given size, cached. Used so
 *  the caret spans the exact top-to-bottom height of the text glyphs rather
 *  than measuring an inline span's (taller) line box. */
let caretMetricsCache: Record<number, { ascent: number; descent: number }> = {};

function getCaretMetrics(fontSize: number): { ascent: number; descent: number } {
  const cached = caretMetricsCache[fontSize];
  if (cached) return cached;

  let ascent = fontSize * 0.75;
  let descent = fontSize * 0.2;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${fontSize}px ${CARET_FONT}`;
      const m = ctx.measureText('Mhgq');
      if (m.actualBoundingBoxAscent) ascent = m.actualBoundingBoxAscent;
      if (m.actualBoundingBoxDescent) descent = m.actualBoundingBoxDescent;
    }
  } catch {
    // Fall back to the estimate above.
  }
  const metrics = { ascent, descent };
  caretMetricsCache[fontSize] = metrics;
  return metrics;
}

function clearCaretMetrics(): void {
  caretMetricsCache = {};
}

export function TypingDisplay({
  wordStates,
  currentWordIndex,
  fontSize = 22,
  lineHeight = 2.4,
}: TypingDisplayProps) {
  const currentWordRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const lineHeightPx = fontSize * lineHeight;

  const [caretStyle, setCaretStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [repositionTick, setRepositionTick] = useState(0);
  /** 'typing' = solid, fully-visible bar (must not blink while the user is
   *  actively typing). 'idle' = smooth, deliberate blink. */
  const [caretMode, setCaretMode] = useState<'typing' | 'idle'>('typing');
  const idleTimerRef = useRef<number | null>(null);

  const activeWord = wordStates[currentWordIndex];

  // Determine which character the caret should hug, and whether it sits after it.
  let anchor: CaretAnchor | null = null;
  if (activeWord) {
    const typed = activeWord.typed.length;
    const len = activeWord.word.length;
    if (len === 0) {
      // Empty word — nothing to anchor to; hide the caret for safety.
      anchor = null;
    } else if (typed >= len) {
      // Whole word typed (awaiting space) — caret sits after the last character.
      anchor = { wordIdx: currentWordIndex, charIdx: len - 1, afterChar: true };
    } else {
      // Caret sits before the next character to type.
      anchor = { wordIdx: currentWordIndex, charIdx: Math.min(typed, len - 1), afterChar: false };
    }
  }

  // Scroll current word into view smoothly
  useEffect(() => {
    if (currentWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const word = currentWordRef.current;
      const wordTop = word.offsetTop;
      const containerHeight = container.clientHeight;

      // Keep current word in the top third of the visible area
      const targetScroll = wordTop - lineHeightPx;
      if (targetScroll > 0) {
        container.scrollTop = targetScroll;
      } else {
        container.scrollTop = 0;
      }
    }
  }, [currentWordIndex, fontSize, lineHeightPx]);

  // Position the absolutely-positioned caret from the anchor character's real
  // rendered box, measured against the scrolling content so it tracks the exact
  // text position on every line, wraps, mid-word, and at the end of a word.
  useLayoutEffect(() => {
    const el = anchorRef.current;
    const content = contentRef.current;
    if (!anchor || !el || !content) {
      setCaretStyle({ opacity: 0 });
      return;
    }
    const charRect = el.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    // Caret height = the font's real glyph height (ascender + descender), so it
    // spans top-to-bottom of the character rather than the taller line box. A
    // floor keeps it visibly sized even if the webfont hasn't painted yet.
    const { ascent, descent } = getCaretMetrics(fontSize);
    const caretHeight = Math.max(ascent + descent, Math.round(fontSize * 0.9));

    // Vertically center the caret within the character's line box: the char's
    // rect spans the full line (including leading), so align it to the middle.
    const top = charRect.top - contentRect.top + (charRect.height - caretHeight) / 2;

    // Sit the caret's nearest edge flush against the letter it precedes —
    // before the next character while typing, directly after a fully-typed
    // word. No gap, so it reads as "this is the next character to type".
    const gap = CARET_GAP;
    let left = charRect.left - contentRect.left - CARET_WIDTH - gap;
    if (anchor.afterChar) {
      left = charRect.right - contentRect.left + gap;
    }

    setCaretStyle({ left, top, height: caretHeight, opacity: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWordIndex, wordStates, fontSize, repositionTick]);

  // Root-cause fix for the "caret disappears while typing" bug: the blink was a
  // CSS animation running unconditionally on the caret element, so it forced the
  // bar invisible every cycle regardless of input and never reset on a keystroke.
  // Now each input (props change) snaps the caret back to a solid, fully-visible
  // bar, and only (re)starts the idle blink once the user pauses typing.
  useEffect(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setCaretMode('typing');
    idleTimerRef.current = window.setTimeout(() => {
      setCaretMode('idle');
    }, CARET_IDLE_MS);
  }, [wordStates, currentWordIndex, repositionTick]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, []);

  // Re-measure after the webfont loads (canvas/measureText metrics change from
  // the fallback to the real font) and whenever the typing area is resized, so
  // the caret never keeps stale geometry measured against the pre-font or
  // pre-layout boxes. Bumping the tick re-runs the positioning pass above.
  useEffect(() => {
    let cancelled = false;

    const reposition = () => {
      if (cancelled) return;
      clearCaretMetrics();
      setRepositionTick((t) => t + 1);
    };

    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    void fonts?.ready?.then(reposition);

    const container = containerRef.current;
    const observer = container
      ? new ResizeObserver(() => {
          if (!cancelled) setRepositionTick((t) => t + 1);
        })
      : null;
    observer?.observe(container ?? document.body);
    window.addEventListener('resize', reposition);

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener('resize', reposition);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden select-none"
      style={{ height: `${lineHeightPx * 3}px` }} // show ~3 lines
    >
      <div
        ref={contentRef}
        className="relative font-mono leading-relaxed flex flex-wrap gap-x-3 gap-y-1"
        style={{
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: `${fontSize}px`,
          lineHeight,
        }}
      >
        {wordStates.map((wordState, wordIdx) => {
          const isActive = wordIdx === currentWordIndex;

          return (
            <span
              key={wordIdx}
              ref={isActive ? currentWordRef : undefined}
              className={cn(
                'inline-flex relative',
                wordState.status === 'error' && 'word-error-bg'
              )}
            >
              {wordState.chars.map((charState, charIdx) => {
                const isAnchor =
                  isActive &&
                  anchor !== null &&
                  anchor.wordIdx === wordIdx &&
                  anchor.charIdx === charIdx;

                return (
                  <span
                    key={charIdx}
                    ref={isAnchor ? anchorRef : undefined}
                    className={cn(
                      'relative',
                      charState.status === 'current' && 'char-current'
                    )}
                  >
                    <span
                      className={cn(
                        charState.status === 'correct' && 'char-correct',
                        charState.status === 'error' && 'char-error',
                        charState.status === 'pending' && 'char-pending',
                        charState.status === 'extra' && 'char-error'
                      )}
                    >
                      {charState.char}
                    </span>
                  </span>
                );
              })}
            </span>
          );
        })}

        <span
          className={cn('typing-caret-abs', caretMode === 'idle' && 'blinking')}
          aria-hidden="true"
          style={caretStyle}
        />
      </div>
    </div>
  );
}
