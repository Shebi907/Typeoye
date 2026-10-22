import React from 'react';
import { URDU_DIGIT_MAP, URDU_PHONETIC_MAP, isCombiningMark } from '../../utils/urduPhonetic';

interface KeyDef {
  /** Map key for the unshifted (base) layer, e.g. `a`, `.`, ` ` or a digit. */
  base?: string;
  /** Map key for the Shift layer, e.g. `A`, `>` — must mirror URDU_CHAR_TO_KEY. */
  shift?: string;
  /** English physical-key label shown on the key. */
  label: string;
  /** Relative key width (1 = a standard letter key). */
  units?: number;
  /** Modifier key (no Urdu character). */
  modifier?: boolean;
  /** This key is a Shift key — highlighted while Shift is active. */
  shiftKey?: boolean;
}

/** A letter key: base = lowercase, Shift = uppercase (matches the engine). */
const letter = (ch: string): KeyDef => ({ base: ch, shift: ch.toUpperCase(), label: ch });
const row = (letters: string): KeyDef[] => letters.split('').map(letter);

/**
 * Physical ANSI rows. Base + Shift map keys are taken verbatim from the verified
 * phonetic map / CODE_TO_SHIFT so the on-screen Shift label always equals what
 * `urduKeyFromEvent` actually outputs. Digits intentionally have no Shift layer
 * (the engine ignores Shift for Digit codes).
 */
const ROWS: KeyDef[][] = [
  [
    { base: '1', label: '1' }, { base: '2', label: '2' }, { base: '3', label: '3' },
    { base: '4', label: '4' }, { base: '5', label: '5' }, { base: '6', label: '6' },
    { base: '7', label: '7' }, { base: '8', label: '8' }, { base: '9', label: '9' },
    { base: '0', label: '0' },
    { base: '-', shift: '_', label: '-' }, { base: '=', shift: '+', label: '=' },
    { label: '⌫', units: 2, modifier: true },
  ],
  [
    { label: 'Tab', units: 1.5, modifier: true },
    ...row('qwertyuiop'),
    { base: '[', shift: '{', label: '[' }, { base: ']', shift: '}', label: ']' },
    { base: '\\', shift: '|', label: '\\', units: 1.5 },
  ],
  [
    { label: 'Caps', units: 1.75, modifier: true },
    ...row('asdfghjkl'),
    { base: ';', shift: ':', label: ';' }, { base: "'", shift: '"', label: "'" },
    { label: 'Enter', units: 2.25, modifier: true },
  ],
  [
    { label: '⇧ Shift', units: 2.25, modifier: true, shiftKey: true },
    ...row('zxcvbnm'),
    { base: ',', shift: '<', label: ',' }, { base: '.', shift: '>', label: '.' },
    { base: '/', shift: '?', label: '/' },
    { label: '⇧ Shift', units: 2.25, modifier: true, shiftKey: true },
  ],
  [
    { base: ' ', label: 'Space', units: 9, modifier: true },
  ],
];

const ACCENT = '#4361EE';

/** Combining marks have no advance width; sit them on a dotted circle to show them. */
const DOTTED_CIRCLE = '\u25CC';
const legendGlyph = (char: string) => (isCombiningMark(char) ? `${DOTTED_CIRCLE}${char}` : char);

interface UrduVirtualKeyboardProps {
  /** Physical key (map key) of the next character to type — highlights that key. */
  activeKey?: string;
  /** Shift layer is active (next char needs Shift, or Shift is held). */
  shiftActive?: boolean;
  urduDigits?: boolean;
}

export function UrduVirtualKeyboard({ activeKey, shiftActive = false, urduDigits = false }: UrduVirtualKeyboardProps) {
  const active = (activeKey ?? '').toLowerCase();

  return (
    <div
      dir="ltr"
      data-shift-active={shiftActive ? 'true' : undefined}
      className="mx-auto w-full max-w-[54rem] overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-800/60 sm:p-3"
    >
      <div className="flex min-w-[38rem] flex-col gap-1 pb-1 sm:min-w-0 sm:gap-1.5">
        {ROWS.map((keys, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 sm:gap-1.5">
            {keys.map((key, keyIndex) => {
                const baseChar = key.base
                  ? urduDigits && /^[0-9]$/.test(key.base)
                    ? URDU_DIGIT_MAP[key.base] ?? (URDU_PHONETIC_MAP[key.base] || '')
                    : URDU_PHONETIC_MAP[key.base] || ''
                  : '';
                const shiftChar = key.shift ? URDU_PHONETIC_MAP[key.shift] || '' : '';
              const showShift = shiftChar !== '' && shiftChar !== baseChar;
              const shiftLayer = shiftActive && showShift;
              const isActive = key.shiftKey
                ? !!key.shiftKey && shiftActive
                : active.length > 0 &&
                  ((!!key.base && key.base.toLowerCase() === active) ||
                    (!!key.shift && key.shift.toLowerCase() === active));
              const units = key.units ?? 1;

              return (
                <div
                  key={`${key.label}-${keyIndex}`}
                  data-key={key.base ?? key.label}
                  data-base={baseChar || undefined}
                  data-shift={showShift ? shiftChar : undefined}
                  data-active={isActive ? 'true' : undefined}
                  data-modifier={key.modifier ? 'true' : undefined}
                  data-shift-key={key.shiftKey ? 'true' : undefined}
                  className={
                    'relative flex h-12 flex-col items-center justify-center overflow-hidden rounded-md border transition-[box-shadow,border-color,background-color] duration-100 select-none sm:rounded-lg ' +
                    (isActive
                      ? 'border-[#4361EE] bg-[rgba(67,97,238,0.12)]'
                      : key.shiftKey
                        ? 'border-[rgba(67,97,238,0.35)] bg-[rgba(67,97,238,0.06)] dark:border-slate-500 dark:bg-slate-700'
                        : key.modifier
                          ? 'border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700/70'
                          : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700/60')
                  }
                  style={{
                    flexGrow: units,
                    flexBasis: 0,
                    minWidth: `${Math.max(1.5, units * 1.5)}rem`,
                    boxShadow: isActive ? '0 0 0 2px rgba(67,97,238,0.35)' : undefined,
                  }}
                >
                  {key.modifier || !baseChar ? (
                    <span
                      className="px-1 font-sans text-[0.62rem] leading-none text-slate-500 dark:text-slate-300 sm:text-xs"
                      style={isActive ? { color: '#4361EE', fontWeight: 700 } : undefined}
                    >
                      {key.label}
                    </span>
                  ) : (
                    <div
                      className="flex h-full w-full flex-col items-center justify-center"
                      style={{ padding: '0.15rem 0.25rem 0.3rem' }}
                    >
                      <div className="flex w-full items-start justify-between leading-none">
                        <span className="font-sans text-[0.5rem] text-slate-400 dark:text-slate-500 sm:text-[0.55rem]">
                          {key.label}
                        </span>
                        {showShift && (
                          <span
                            className={
                              'font-urdu font-medium text-slate-500 dark:text-slate-300 ' +
                              (isCombiningMark(shiftChar)
                                ? 'text-[0.62rem] sm:text-[0.68rem]'
                                : 'text-[0.5rem] sm:text-[0.55rem]')
                            }
                            style={{
                              lineHeight: isCombiningMark(shiftChar) ? 1.45 : 1.9,
                              ...(shiftLayer ? { color: ACCENT, fontWeight: 700 } : {}),
                            }}
                          >
                            {legendGlyph(shiftChar)}
                          </span>
                        )}
                      </div>
                      <span
                        className="font-urdu text-[0.72rem] font-semibold text-slate-800 dark:text-slate-100"
                        style={{
                          lineHeight: 1.9,
                          opacity: shiftLayer ? 0.5 : 1,
                          transition: 'opacity 100ms',
                        }}
                      >
                        {baseChar || key.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
