import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CharState, WordState } from '../../types';
import { cn } from '../../utils/cn';

interface UrduTypingDisplayProps {
  wordStates: WordState[];
  currentWordIndex: number;
  /** Base font size in px (default 30). Kept a whole pixel so glyphs rasterise crisply. */
  fontSize?: number;
  /** Unitless line-height multiplier (default 2.6 — Nastaliq needs room for ascenders/descenders). */
  lineHeight?: number;
}

/**
 * One proper Urdu stack. Noto Nastaliq Urdu first (the script's traditional
 * hand), then Noto Naskh Arabic (same visual family, shallower), then the
 * generic serif. Never a monospace font: Urdu is cursive, so a monospace
 * family plus its default tracking would break the joins.
 */
const URDU_FONT = "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif";
/** Milliseconds of no input before the caret starts its idle blink. */
const CARET_IDLE_MS = 350;
/** How many lines of the passage are visible in the scroll window. */
const VISIBLE_LINES = 3;

/**
 * Resolve which reference character the RTL caret hugs and which edge of that
 * character it sits on. Exported (pure) so the direction/edge maths can be
 * verified without a browser.
 *
 * RTL text renders right-to-left, so character 0 is the right-most glyph. After
 * typing `k` characters the caret sits at the boundary between character `k-1`
 * and character `k` — the RIGHT edge of character `k`. Once the whole word is
 * typed (k === length) the caret sits after the final (left-most) glyph, i.e.
 * the LEFT edge of the last character.
 */
export function resolveRtlCaret(k: number, length: number): { index: number; edge: 'left' | 'right' } | null {
  if (length <= 0) return null;
  const clamped = Math.max(0, Math.min(k, length));
  if (clamped < length) return { index: clamped, edge: 'right' };
  return { index: length - 1, edge: 'left' };
}

/**
 * Foreground-colour class for one character of the word being typed. Correct
 * characters turn green and wrong characters turn red the moment they are
 * typed; untyped characters (`pending`/`current`) stay neutral so they inherit
 * the passage colour. Only the colour changes — never a background, glow or
 * shadow.
 */
function charClass(status: CharState['status']): string {
  if (status === 'correct') return 'urdu-char-correct';
  if (status === 'error') return 'urdu-char-error';
  return '';
}

/**
 * Urdu (Nastaliq) passage renderer.
 *
 * A committed word shows a single WORD-level verdict (green when correct, red
 * when wrong). The word currently being typed is marked CHARACTER by
 * CHARACTER so feedback is immediate rather than waiting for the whole word.
 *
 * The per-character marks are plain INLINE spans with no other styling. That is
 * deliberate: painting sub-ranges of a word (as the Custom Highlight API did)
 * forces the Nastaliq run onto a separate compositing layer and makes the text
 * read as blurry/broken, whereas plain inline spans keep the word on one
 * shaped run — verified pixel-identical to the unsplit text on this engine.
 */
export function UrduTypingDisplay({
  wordStates,
  currentWordIndex,
  fontSize = 30,
  lineHeight = 2.8,
}: UrduTypingDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);

  const [caretStyle, setCaretStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [caretMode, setCaretMode] = useState<'typing' | 'idle'>('typing');
  const [repositionTick, setRepositionTick] = useState(0);
  const idleTimerRef = useRef<number | null>(null);

  // Snap the line box to a whole pixel so every wrapped line sits on the same
  // raster rows (a fractional line-height re-rasterises the cursive strokes off
  // the pixel grid). A Nastaliq-sized line-height (2.8) is what actually gives
  // the glyphs their top/bottom breathing room — measured ink at 30px is ~67px
  // (49 asc + 18 desc) inside an 84px line box, so nothing is clipped. Adding
  // extra inner padding to the scrolling window would only push the *next* line
  // up into view and re-create a half-cut line at the bottom, so the window is
  // kept an exact whole number of lines.
  const lineHeightPx = Math.round(lineHeight * fontSize);
  const active = wordStates[currentWordIndex];

  // Scroll the active word into view, mirroring the English test (the active
  // line is kept as the second visible line).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !activeWordRef.current) return;
    const target = activeWordRef.current.offsetTop - lineHeightPx;
    container.scrollTop = target > 0 ? target : 0;
  }, [currentWordIndex, fontSize, lineHeightPx]);

  // Position the caret character-by-character from the live glyph geometry.
  useLayoutEffect(() => {
    const content = contentRef.current;
    const caret = caretRef.current;
    const wordEl = activeWordRef.current;
    if (!content || !caret || !active || !wordEl) {
      setCaretStyle({ opacity: 0 });
      return;
    }
    const contentRect = content.getBoundingClientRect();

    // Typed past the reference word: the caret trails the extra (red) chars.
    const extraEl = wordEl.querySelector<HTMLElement>('[data-extra]');
    if (extraEl) {
      const rect = extraEl.getBoundingClientRect();
      const height = Math.min(rect.height, fontSize * 1.9);
      const caretWidth = caret.offsetWidth || 2;
      const left = Math.max(0, Math.min(rect.left - contentRect.left, content.clientWidth - caretWidth));
      setCaretStyle({
        left,
        top: rect.top - contentRect.top + (rect.height - height) / 2,
        height,
        opacity: 1,
      });
      return;
    }

    const textEl = wordEl.querySelector<HTMLElement>('[data-word-text]') ?? wordEl;

    const target = resolveRtlCaret(active.typed.length, active.word.length);
    if (!target) {
      setCaretStyle({ opacity: 0 });
      return;
    }

    // The active word is rendered character-by-character, so hug the glyph box
    // of the character the caret is attached to.
    const charEl = textEl.querySelector<HTMLElement>(`[data-char="${target.index}"]`);
    const rect = charEl
      ? charEl.getBoundingClientRect()
      : (() => { const r = document.createRange(); r.selectNodeContents(textEl); return r.getBoundingClientRect(); })();
    const height = Math.min(rect.height, fontSize * 1.9);
    // At the RTL start of a line the caret would sit exactly on the container's
    // right edge and be clipped away by `overflow-hidden`; clamp it so it is
    // visible from the very first frame, before any typing.
    const caretWidth = caret.offsetWidth || 2;
    const rawLeft = (target.edge === 'right' ? rect.right : rect.left) - contentRect.left;
    const left = Math.max(0, Math.min(rawLeft, content.clientWidth - caretWidth));
    setCaretStyle({
      left,
      top: rect.top - contentRect.top + (rect.height - height) / 2,
      height,
      opacity: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordStates, currentWordIndex, fontSize, repositionTick]);

  // Solid caret while typing; start the idle blink only after a pause.
  useEffect(() => {
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    setCaretMode('typing');
    idleTimerRef.current = window.setTimeout(() => setCaretMode('idle'), CARET_IDLE_MS);
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    };
  }, [wordStates, currentWordIndex, repositionTick]);

  // Re-measure after the Nastaliq webfont loads and on resize.
  useEffect(() => {
    let cancelled = false;
    const reposition = () => {
      if (!cancelled) setRepositionTick((t) => t + 1);
    };
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    void fonts?.ready?.then(reposition);
    const observer = containerRef.current ? new ResizeObserver(reposition) : null;
    observer?.observe(containerRef.current ?? document.body);
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
      // Exactly the visible lines — no half-line peeks in at the bottom, and the
      // Nastaliq line-height already contains ascenders/descenders.
      style={{ height: `${lineHeightPx * VISIBLE_LINES}px` }}
    >
      <div
        ref={contentRef}
        dir="rtl"
        lang="ur"
        className="urdu-display relative flex flex-wrap gap-x-4"
        style={{
          fontFamily: URDU_FONT,
          fontSize: `${fontSize}px`,
          lineHeight: `${lineHeightPx}px`,
          color: 'var(--color-pending)',
        }}
      >
        {wordStates.map((wordState, wordIdx) => {
          const extra = wordState.typed.slice(wordState.word.length);
          const isActive = wordIdx === currentWordIndex;
          return (
            <span
              key={wordIdx}
              ref={isActive ? activeWordRef : undefined}
              className={cn(
                'relative inline-block',
                !isActive && wordState.status === 'correct' && 'word-correct',
                !isActive && wordState.status === 'error' && 'word-error',
              )}
            >
              <span data-word-text={wordIdx}>
                {isActive
                  ? wordState.chars
                      .slice(0, wordState.word.length)
                      .map((charState, charIdx) => (
                        <span key={charIdx} data-char={charIdx} className={charClass(charState.status)}>
                          {charState.char}
                        </span>
                      ))
                  : wordState.word}
              </span>
              {extra && (
                <span data-extra className="word-extra">
                  {extra}
                </span>
              )}
            </span>
          );
        })}

        <span
          ref={caretRef}
          className={cn('typing-caret-abs', caretMode === 'idle' && 'blinking')}
          aria-hidden="true"
          style={caretStyle}
        />
      </div>
    </div>
  );
}
