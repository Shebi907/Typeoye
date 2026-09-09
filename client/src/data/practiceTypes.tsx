import { Type, Keyboard, AlignLeft, MessageSquare, FileText, Zap, PenLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PracticeType } from '../types';

export interface PracticeTypeMeta {
  key: PracticeType;
  slug: string;
  label: string;
  desc: string;
  heroTitle: string;
  heroDesc: string;
  icon: LucideIcon;
  badge?: string;
}

export const PRACTICE_TYPES: PracticeTypeMeta[] = [
  { key: 'character', slug: 'character', label: 'Character', desc: 'Practice specific characters', heroTitle: 'Character Practice', heroDesc: 'Practice specific characters and improve your keyboard coverage.', icon: Type },
  { key: 'combination', slug: 'combination', label: 'Combination', desc: 'Practice common key combinations', heroTitle: 'Combination Practice', heroDesc: 'Practice common key combinations for smoother transitions.', icon: Keyboard },
  { key: 'word', slug: 'words', label: 'Words', desc: 'Practice typing common words', heroTitle: 'Words Practice', heroDesc: 'Practice typing common words and improve your speed and accuracy.', icon: AlignLeft },
  { key: 'sentence', slug: 'sentences', label: 'Sentences', desc: 'Practice typing real sentences', heroTitle: 'Sentences Practice', heroDesc: 'Practice typing real sentences for natural rhythm and flow.', icon: MessageSquare },
  { key: 'paragraph', slug: 'paragraphs', label: 'Paragraphs', desc: 'Practice longer paragraphs', heroTitle: 'Paragraphs Practice', heroDesc: 'Practice typing longer paragraphs and build sustained speed.', icon: FileText },
  { key: 'quick', slug: 'quick', label: 'Quick Practice', desc: 'Personalized practice based on your recent performance', heroTitle: 'Quick Practice', heroDesc: 'A personalized practice session based on your recent performance.', icon: Zap, badge: 'Recommended' },
  { key: 'custom', slug: 'custom', label: 'Custom Text', desc: 'Practice with your own text', heroTitle: 'Custom Text Practice', heroDesc: 'Practice with your own text — paste anything you want to type faster.', icon: PenLine },
];

export const PRACTICE_TYPE_BY_SLUG: Record<string, PracticeTypeMeta> = Object.fromEntries(
  PRACTICE_TYPES.map((t) => [t.slug, t])
);

export const TIME_OPTIONS: { label: string; value: number }[] = [
  { label: '1 Minute', value: 60 },
  { label: '2 Minutes', value: 120 },
  { label: '5 Minutes', value: 300 },
  { label: '10 Minutes', value: 600 },
  { label: '15 Minutes', value: 900 },
];

export const DIFFICULTY_OPTIONS: { label: string; value: 'beginner' | 'intermediate' | 'advanced'; desc: string }[] = [
  { label: 'Easy', value: 'beginner', desc: 'For beginners. Short and simple words.' },
  { label: 'Medium', value: 'intermediate', desc: 'For intermediate typists. Balanced practice.' },
  { label: 'Hard', value: 'advanced', desc: 'For advanced typists. Longer and more complex text.' },
];

export const PRACTICE_TIPS = [
  'Keep your fingers on the home row keys',
  'Focus on accuracy before speed',
  'Maintain a steady typing rhythm',
  'Practice regularly to improve',
];

export function durationLabel(seconds: number): string {
  return TIME_OPTIONS.find((t) => t.value === seconds)?.label ?? `${Math.round(seconds / 60)} Minutes`;
}

export function difficultyLabel(value: string): string {
  return DIFFICULTY_OPTIONS.find((d) => d.value === value)?.label ?? 'Easy';
}