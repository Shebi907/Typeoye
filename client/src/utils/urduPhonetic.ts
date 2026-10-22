export type UrduKeyMap = {
  [key: string]: string;
};

/** Digit key -> Urdu numeral (Urdu keyboard layouts print ۰-۹ on the number row). */
export const URDU_DIGIT_MAP: UrduKeyMap = { '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹', '0': '۰' };

export const URDU_PHONETIC_MAP: UrduKeyMap = {
  a: 'ا',
  b: 'ب',
  c: 'چ',
  d: 'د',
  e: 'ع',
  f: 'ف',
  g: 'گ',
  h: 'ح',
  i: 'ی',
  j: 'ج',
  k: 'ک',
  l: 'ل',
  m: 'م',
  n: 'ن',
  o: 'ہ',
  p: 'پ',
  q: 'ق',
  r: 'ر',
  s: 'س',
  t: 'ت',
  u: 'ء',
  v: 'ط',
  w: 'و',
  x: 'ش',
  y: 'ے',
  z: 'ز',
  A: 'آ',
  B: '.',
  C: 'ث',
  D: 'ڈ',
  E: 'ٰ',
  F: 'ّ',
  G: 'غ',
  H: 'ھ',
  I: 'ِ',
  J: 'ض',
  K: 'خ',
  L: 'ٔ',
  M: '٘',
  N: 'ں',
  O: 'ۃ',
  P: 'ُ',
  Q: 'ْ',
  R: 'ڑ',
  S: 'ص',
  T: 'ٹ',
  U: 'ئ',
  V: 'ظ',
  W: 'ّ',
  X: 'ژ',
  Y: 'َ',
  Z: 'ذ',
  ' ': ' ',
  '.': '۔',
  ',': '،',
  ';': '؛',
  ':': ':',
  '?': '؟',
  '!': '!',
  "'": "'",
  '"': '"',
  '(': '(',
  ')': ')',
  '[': '[',
  ']': ']',
  '{': '{',
  '}': '}',
  '-': '-',
  '_': '_',
  '+': '+',
  '=': '=',
  '/': '/',
  '\\': '\\',
  '|': '|',
  '': '',
  '~': '~',
  '<': '<',
  '>': '٫',
  '@': '@',
  '#': '#',
  '$': '$',
  '%': '%',
  '^': '^',
  '&': '&',
  '*': '*',
};

/** Map `event.code` (layout independent) to the base key character. */
export const CODE_TO_BASE: Record<string, string> = {
  Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backquote: '`',
};

/** Base key character produced when Shift is held. */
export const CODE_TO_SHIFT: Record<string, string> = {
  Minus: '_', Equal: '+', BracketLeft: '{', BracketRight: '}', Backslash: '|',
  Semicolon: ':', Quote: '"', Comma: '<', Period: '>', Slash: '?', Backquote: '~',
};

/**
 * Matches Arabic/Urdu combining marks (Unicode category Mn): the diacritics the
 * CRULP v1.1 Shift layer produces (zabar, zer, pesh, shadda, jazm/sukun, khari
 * zabar, hamza above, noon-ghunna, fathatan). Such a character has no width of
 * its own, so the keyboard renders it on a dotted circle (U+25CC) to keep it
 * visible instead of silently attaching to the previous glyph.
 */
const COMBINING_MARK_RE = /^[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]$/;

/** True when `char` is an Arabic/Urdu combining mark (needs a base to display). */
export function isCombiningMark(char: string): boolean {
  return COMBINING_MARK_RE.test(char);
}

/** Remove invisible formatting + unify look-alike Arabic/Urdu letters so they
 *  never cause false errors (ی/ي, ک/ك, ہ/ه and zero-width joiners). */
export function normalizeUrdu(input: string): string {
  return input
    .replace(/\u064A/g, '\u06CC') // ARABIC YEH -> URDU YEH
    .replace(/\u0643/g, '\u06A9') // ARABIC KAF -> URDU KAF
    .replace(/\u0647/g, '\u06C1') // Arabic Heh -> Urdu Heh
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
}

/** Shift characters as produced by CODE_TO_SHIFT. */
const SHIFT_CHARS = new Set(Object.values(CODE_TO_SHIFT));

/** True when producing `key` requires Shift on a physical keyboard. */
export function urduKeyNeedsShift(key: string | undefined | null): boolean {
  if (!key) return false;
  if (key.length === 1 && /[A-Z]/.test(key)) return true;
  return SHIFT_CHARS.has(key);
}

/**
 * Resolve the Urdu character for a physical key from `event.code` + Shift state.
 * Layout independent (works regardless of the OS keyboard / Caps Lock). Returns
 * `'Backspace'` for the delete key and `null` for keys we don't map.
 */
export function urduKeyFromEvent(event: KeyboardEvent, options?: { urduNumerals?: boolean }): string | null {
  const code = event.code;
  let key: string;
  if (/^Key[A-Z]$/.test(code)) {
    const base = code.slice(3).toLowerCase();
    key = event.shiftKey ? base.toUpperCase() : base;
  } else if (/^Digit[0-9]$/.test(code)) {
    key = options?.urduNumerals ? (URDU_DIGIT_MAP[code.slice(5)] ?? code.slice(5)) : code.slice(5);
  } else if (code === 'Space') {
    key = ' ';
  } else if (code === 'Backspace') {
    return 'Backspace';
  } else if (CODE_TO_BASE[code] !== undefined) {
    key = event.shiftKey ? CODE_TO_SHIFT[code] : CODE_TO_BASE[code];
  } else {
    return null;
  }
  const mapped = URDU_PHONETIC_MAP[key] ?? key;
  return normalizeUrdu(mapped);
}

/** Reverse lookup: Urdu character -> the physical key that produces it. */
export const URDU_CHAR_TO_KEY: Record<string, string> = (() => {
  const reverse: Record<string, string> = {};
  for (const [key, value] of Object.entries(URDU_PHONETIC_MAP)) {
    if (!value || value === ' ' || value.length > 2) continue;
    if (!(value in reverse)) reverse[value] = key;
  }
  for (const [key, value] of Object.entries(URDU_DIGIT_MAP)) {
    if (!value || value.length > 2) continue;
    if (!(value in reverse)) reverse[value] = key;
  }
  return reverse;
})();

const MAPPED_VALUES = Array.from(new Set(Object.values(URDU_PHONETIC_MAP)))
  .filter((value) => value.trim().length > 0)
  .sort((a, b) => b.length - a.length);

/** Split an Urdu string into typing units (greedy longest mapped match). */
export function tokenizeUrdu(text: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    let matched = '';
    for (const value of MAPPED_VALUES) {
      if (text.startsWith(value, i)) { matched = value; break; }
    }
    if (!matched) matched = text[i];
    tokens.push(matched);
    i += matched.length;
  }
  return tokens;
}
