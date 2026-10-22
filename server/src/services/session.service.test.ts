import assert from 'assert';
import { deriveEnglishLearnSummary } from './session.service';

const lessons = [
  ...Array.from({ length: 16 }, (_, index) => ({ _id: `en-${index + 1}`, order: index + 1, language: 'en' as const, isActive: true })),
  ...Array.from({ length: 16 }, (_, index) => ({ _id: `ur-${index + 1}`, order: index + 1, language: 'ur' as const, isActive: true })),
];
const progress = [
  { lessonId: 'en-1', completedAt: new Date() },
  { lessonId: 'en-2', completedAt: new Date() },
  { lessonId: 'ur-1', completedAt: new Date() },
  { lessonId: 'ur-2', completedAt: new Date() },
  { lessonId: 'en-3' }, // started, but not completed
];

assert.deepStrictEqual(deriveEnglishLearnSummary(lessons, progress), {
  learnLevel: 3,
  completedLessons: 2,
  totalLessons: 16,
});

console.log('session.service language-scoped profile summary test passed');
