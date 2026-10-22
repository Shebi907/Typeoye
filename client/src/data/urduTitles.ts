/**
 * Single source of truth for the Urdu titles shown on the bilingual headers of
 * the Urdu typing screens (test + every practice type).
 *
 * Keys are the exact English titles used in the code. Add an entry here rather
 * than hard-coding a translation inside a page.
 */
export const URDU_TITLE_TRANSLATIONS: Record<string, string> = {
  'Urdu Typing Test': 'اردو ٹائپنگ ٹیسٹ',
  'Character Practice': 'حروف کی پریکٹس',
  'Combination Practice': 'حروف کے مجموعے کی پریکٹس',
  'Word Practice': 'الفاظ کی پریکٹس',
  'Sentence Practice': 'جملوں کی پریکٹس',
  'Paragraph Practice': 'پیراگراف کی پریکٹس',
  'Quick Practice': 'فوری پریکٹس',
  'Custom Text Practice': 'اپنی مرضی کے متن کی پریکٹس',
};

/** Urdu translation for an English typing-screen title ('' when unknown). */
export function urduTitleFor(englishTitle: string): string {
  return URDU_TITLE_TRANSLATIONS[englishTitle] ?? '';
}
