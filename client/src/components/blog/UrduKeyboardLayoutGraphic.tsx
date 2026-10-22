import type { ReactNode } from 'react';
import { CODE_TO_BASE, CODE_TO_SHIFT, isCombiningMark, URDU_DIGIT_MAP, URDU_PHONETIC_MAP } from '../../utils/urduPhonetic';

interface KeySpec {
  label: string;
  base?: string;
  shift?: string;
  digit?: string;
  units?: number;
  modifier?: boolean;
}

const letter = (base: string): KeySpec => ({ label: base, base, shift: base.toUpperCase() });
const letters = (row: string): KeySpec[] => row.split('').map(letter);
const key = (code: string): KeySpec => ({ label: CODE_TO_BASE[code] ?? code, base: CODE_TO_BASE[code], shift: CODE_TO_SHIFT[code] });
const modifier = (label: string, units = 1.3): KeySpec => ({ label, units, modifier: true });
const numberKeys: KeySpec[] = '1234567890'.split('').map((digit) => ({ label: digit, digit }));

const ROWS: KeySpec[][] = [
  [key('Backquote'), ...numberKeys, key('Minus'), key('Equal'), modifier('Backspace', 2)],
  [modifier('Tab', 1.5), ...letters('qwertyuiop'), key('BracketLeft'), key('BracketRight'), key('Backslash')],
  [modifier('Caps', 1.8), ...letters('asdfghjkl'), key('Semicolon'), key('Quote'), modifier('Enter', 2.2)],
  [modifier('Shift', 2.1), ...letters('zxcvbnm'), key('Comma'), key('Period'), key('Slash'), modifier('Shift', 2.1)],
  [modifier('Ctrl'), modifier('Win'), modifier('Alt'), { label: 'Space', base: ' ', units: 6.8 }, modifier('Alt'), modifier('Win'), modifier('Ctrl')],
];

const KEY_WIDTH = 92;
const KEY_HEIGHT = 112;
const GAP = 8;
const ROW_GAP = 16;
const CANVAS_WIDTH = 1680;
const BASE_FONT = "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif";

function outputFor(value: string | undefined, digit: string | undefined): string {
  if (digit) return URDU_DIGIT_MAP[digit] ?? digit;
  if (value === undefined) return '';
  // Number-row keys ignore Shift in the live converter. All other keys use the
  // same lookup/fallback and combining-mark display treatment as the UI.
  const output = URDU_PHONETIC_MAP[value] ?? value;
  if (output === ' ') return '␠';
  return isCombiningMark(output) ? `◌${output}` : output;
}

function KeyCap({ spec, x, y, index }: { spec: KeySpec; x: number; y: number; index: number }): ReactNode {
  const width = KEY_WIDTH * (spec.units ?? 1) + GAP * ((spec.units ?? 1) - 1);
  const isDigit = !!spec.digit;
  const normal = outputFor(spec.base, spec.digit);
  const shifted = isDigit ? normal : outputFor(spec.shift ?? spec.base, undefined);
  const title = `${spec.label}: normal ${normal || 'no character'}; Shift ${shifted || 'no character'}`;
  const englishLabel = /^[a-z]$/.test(spec.label) ? spec.label.toUpperCase() : spec.label;
  return (
    <g key={`${spec.label}-${index}`} transform={`translate(${x} ${y})`}>
      <title>{title}</title>
      <rect x="0" y="3" width={width} height={KEY_HEIGHT} rx="12" fill="#d7def2" opacity="0.78" />
      <rect x="0" y="0" width={width} height={KEY_HEIGHT} rx="12" fill={spec.modifier ? '#eef1fa' : '#ffffff'} stroke="#d9deed" strokeWidth="2" />
      <text x={width / 2} y="29" textAnchor="middle" dominantBaseline="middle" direction="rtl" unicodeBidi="plaintext" fontFamily={BASE_FONT} fontSize="27" fill="#5b3bc4">{spec.modifier ? '—' : shifted}</text>
      <text x={width / 2} y="59" textAnchor="middle" dominantBaseline="middle" fontFamily={spec.modifier ? 'Inter, Arial, sans-serif' : 'JetBrains Mono, monospace'} fontSize={spec.modifier ? 15 : 22} fontWeight="700" fill="#202a48">{englishLabel}</text>
      <text x={width / 2} y="94" textAnchor="middle" dominantBaseline="middle" direction="rtl" unicodeBidi="plaintext" fontFamily={BASE_FONT} fontSize="27" fill="#202a48">{spec.modifier ? '—' : normal}</text>
    </g>
  );
}

function rowWidth(row: KeySpec[]): number {
  return row.reduce((sum, spec) => sum + KEY_WIDTH * (spec.units ?? 1) + GAP * ((spec.units ?? 1) - 1) + GAP, -GAP);
}

/** Full physical ANSI layout, driven directly by the Urdu typing converter maps. */
export function UrduKeyboardLayoutGraphic({ className = '' }: { className?: string }) {
  return (
      <svg viewBox="0 0 1680 870" role="img" aria-labelledby="urdu-layout-title urdu-layout-desc" className={`block h-full w-full ${className}`} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <title id="urdu-layout-title">Typeoye Urdu Phonetic Keyboard Layout</title>
        <desc id="urdu-layout-desc">Full English QWERTY keyboard with Urdu characters for normal and Shift key presses, generated from Typeoye’s Urdu phonetic map.</desc>
        <rect width="1680" height="870" rx="26" fill="#f6f7fc" />
        <circle cx="1560" cy="110" r="115" fill="#4361ee" opacity="0.07" />
        <circle cx="120" cy="760" r="145" fill="#7c3aed" opacity="0.06" />
        <text x="840" y="58" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="34" fontWeight="800" fill="#202a48">Typeoye Urdu Phonetic Keyboard</text>
        <text x="840" y="94" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="17" fill="#5b647e">Top: Shift Urdu · Middle: English key · Bottom: normal Urdu</text>
        <g transform="translate(415 119)">
          <circle cx="8" cy="9" r="7" fill="#5b3bc4" />
          <text x="24" y="14" fontFamily="Inter, Arial, sans-serif" fontSize="14" fill="#59627c">Shift Urdu (top)</text>
          <circle cx="180" cy="9" r="7" fill="#202a48" />
          <text x="196" y="14" fontFamily="Inter, Arial, sans-serif" fontSize="14" fill="#59627c">Normal Urdu (bottom)</text>
          <text x="390" y="15" fontFamily="Inter, Arial, sans-serif" fontSize="13" fill="#747d95">— = no Urdu output for modifier keys</text>
        </g>
        {ROWS.map((row, rowIndex) => {
          const y = 148 + rowIndex * (KEY_HEIGHT + ROW_GAP);
          let x = (CANVAS_WIDTH - rowWidth(row)) / 2;
          return (
            <g key={`row-${rowIndex}`}>
              {row.map((spec, index) => {
                const element = <KeyCap key={`${spec.label}-${index}`} spec={spec} x={x} y={y} index={index} />;
                x += KEY_WIDTH * (spec.units ?? 1) + GAP * ((spec.units ?? 1) - 1) + GAP;
                return element;
              })}
            </g>
          );
        })}
        <text x="840" y="820" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="15" fontWeight="600" fill="#59627c">Urdu numerals are used in Urdu Learn; Urdu Test and Practice use 0–9. Shift does not alter number keys.</text>
        <text x="840" y="846" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="13" fill="#7c8498">Combining marks appear on ◌ only for readability; the dotted circle is not typed.</text>
      </svg>
  );
}
