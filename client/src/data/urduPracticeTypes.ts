import type { LucideIcon } from 'lucide-react';
import { AlignLeft, FileText, Keyboard, MessageSquare, PenLine, Type } from 'lucide-react';

/** The six Urdu practice categories shown on the landing page. */
export type UrduPracticeCategory =
  | 'characters'
  | 'combinations'
  | 'words'
  | 'sentences'
  | 'paragraphs'
  | 'custom';

export type UrduPracticeDifficulty = 'easy' | 'medium' | 'hard';

export interface UrduPracticeCategoryMeta {
  key: UrduPracticeCategory;
  slug: string;
  /** English label used in the setup screen / navigation. */
  labelEn: string;
  /** Urdu label shown prominently on the landing page. */
  labelUr: string;
  desc: string;
  heroTitle: string;
  /** English heading shown at the top of the setup page. */
  heroTitleEn: string;
  heroDesc: string;
  icon: LucideIcon;
}

export const URDU_PRACTICE_CATEGORIES: UrduPracticeCategoryMeta[] = [
  {
    key: 'characters',
    slug: 'characters',
    labelEn: 'Characters',
    labelUr: 'حروف',
    desc: 'Practice individual Urdu letters',
    heroTitle: 'حروف کی پریکٹس',
    heroTitleEn: 'Character Practice',
    heroDesc: 'Practice typing individual Urdu letters accurately.',
    icon: Type,
  },
  {
    key: 'combinations',
    slug: 'combinations',
    labelEn: 'Combinations',
    labelUr: 'حروف کے مجموعے',
    desc: 'Practice common letter combinations',
    heroTitle: 'حروف کے مجموعے کی پریکٹس',
    heroTitleEn: 'Combination Practice',
    heroDesc: 'Practice common Urdu letter combinations for smoother typing.',
    icon: Keyboard,
  },
  {
    key: 'words',
    slug: 'words',
    labelEn: 'Words',
    labelUr: 'الفاظ',
    desc: 'Practice common Urdu words',
    heroTitle: 'الفاظ کی پریکٹس',
    heroTitleEn: 'Word Practice',
    heroDesc: 'Practice typing common Urdu words with speed and accuracy.',
    icon: AlignLeft,
  },
  {
    key: 'sentences',
    slug: 'sentences',
    labelEn: 'Sentences',
    labelUr: 'جملے',
    desc: 'Practice full Urdu sentences',
    heroTitle: 'جملوں کی پریکٹس',
    heroTitleEn: 'Sentence Practice',
    heroDesc: 'Practice typing complete Urdu sentences for natural rhythm.',
    icon: MessageSquare,
  },
  {
    key: 'paragraphs',
    slug: 'paragraphs',
    labelEn: 'Paragraphs',
    labelUr: 'پیراگراف',
    desc: 'Practice longer Urdu paragraphs',
    heroTitle: 'پیراگراف کی پریکٹس',
    heroTitleEn: 'Paragraph Practice',
    heroDesc: 'Practice typing longer Urdu paragraphs to build stamina.',
    icon: FileText,
  },
  {
    key: 'custom',
    slug: 'custom',
    labelEn: 'Custom Text',
    labelUr: 'اپنی عبارت',
    desc: 'Practice with your own Urdu text',
    heroTitle: 'اپنی عبارت',
    heroTitleEn: 'Custom Text Practice',
    heroDesc: 'Paste your own Urdu text and practice typing it.',
    icon: PenLine,
  },
];

export const URDU_PRACTICE_CATEGORY_BY_SLUG: Record<string, UrduPracticeCategoryMeta> =
  Object.fromEntries(URDU_PRACTICE_CATEGORIES.map((c) => [c.slug, c]));

/** Practice durations in seconds (1 / 2 / 5 minutes). */
export const URDU_PRACTICE_DURATIONS: { value: 60 | 120 | 300; label: string }[] = [
  { value: 60, label: '1 Min' },
  { value: 120, label: '2 Min' },
  { value: 300, label: '5 Min' },
];

export const URDU_PRACTICE_DIFFICULTIES: {
  value: UrduPracticeDifficulty;
  label: string;
  labelUr: string;
  desc: string;
}[] = [
  { value: 'easy', label: 'Easy', labelUr: 'آسان', desc: 'Simple content.' },
  { value: 'medium', label: 'Medium', labelUr: 'درمیانہ', desc: 'Balanced content.' },
  { value: 'hard', label: 'Hard', labelUr: 'مشکل', desc: 'Complex content.' },
];

export function urduPracticeDurationLabel(seconds: number): string {
  return URDU_PRACTICE_DURATIONS.find((d) => d.value === seconds)?.label
    ?? `${Math.round(seconds / 60)} Min`;
}

export function urduPracticeDifficultyLabel(value: string): string {
  return URDU_PRACTICE_DIFFICULTIES.find((d) => d.value === value)?.label ?? 'Easy';
}

export function urduPracticeDifficultyLabelUr(value: string): string {
  return URDU_PRACTICE_DIFFICULTIES.find((d) => d.value === value)?.labelUr ?? 'آسان';
}
