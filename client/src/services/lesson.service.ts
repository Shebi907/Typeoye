import api from './api';
import type { Achievement, CourseLesson, Exercise, Lesson, LessonProgress, TypedWord } from '../types';

export interface ExerciseCompletion {
  stats: { wpm: number; accuracy: number; correctWords: number; attemptedWords: number; errorsCount: number };
  passed: boolean;
  lessonCompleted: boolean;
  progress: LessonProgress;
  nextLessonUnlocked: boolean;
  xpEarned: number;
  xpBreakdown: { label: string; value: number }[];
  newAchievements: Achievement[];
  leveledUp: boolean;
  prevXP: number;
  newXP: number;
  level: number;
  levelTitle: string;
  prevLevel: number;
}

// Module-level cache keyed so revisiting a page renders its content on the
// very first frame instead of painting a skeleton while it refetches. The
// cache is refreshed in the background on every visit.
let lessonsCache: CourseLesson[] | null = null;
let lessonsRequest: Promise<CourseLesson[]> | null = null;
let lessonsCacheLoadedAt = 0;
let lessonsCacheGeneration = 0;
const LESSONS_CACHE_TTL_MS = 30_000;
const lessonDetailsCache = new Map<string, { lesson: Lesson; exercises: Exercise[]; progress: LessonProgress | null }>();

export const lessonService = {
  clearCache(): void {
    lessonsCache = null;
    lessonsCacheLoadedAt = 0;
    lessonsCacheGeneration += 1;
    lessonsRequest = null;
    lessonDetailsCache.clear();
  },
  /** Synchronous access to already-fetched lessons (null until first fetch). */
  getLessonsCached(): CourseLesson[] | null {
    return lessonsCache;
  },
  async getLessons(): Promise<CourseLesson[]> {
    if (lessonsCache && Date.now() - lessonsCacheLoadedAt < LESSONS_CACHE_TTL_MS) return lessonsCache;
    if (!lessonsRequest) {
      const generation = lessonsCacheGeneration;
      lessonsRequest = api
        .get('/lessons')
        .then(({ data }) => {
          const result = data?.data?.lessons;
          if (!Array.isArray(result) || result.some((lesson: unknown) => {
            const item = lesson as Partial<CourseLesson> | null;
            return !item || typeof item._id !== 'string' || typeof item.category !== 'string'
              || typeof item.completed !== 'boolean' || typeof item.completedExercises !== 'number'
              || typeof item.exerciseCount !== 'number';
          })) {
            throw new Error('The lessons response was incomplete. Please try again.');
          }
          if (generation === lessonsCacheGeneration) {
            lessonsCache = result as CourseLesson[];
            lessonsCacheLoadedAt = Date.now();
          }
          return result as CourseLesson[];
        })
        .finally(() => {
          if (generation === lessonsCacheGeneration) lessonsRequest = null;
        });
    }
    return lessonsRequest;
  },
  getLessonCached(id: string): { lesson: Lesson; exercises: Exercise[]; progress: LessonProgress | null } | null {
    return lessonDetailsCache.get(id) || null;
  },
  async getLesson(id: string): Promise<{ lesson: Lesson; exercises: Exercise[]; progress: LessonProgress | null }> {
    if (lessonDetailsCache.has(id)) {
      return lessonDetailsCache.get(id)!;
    }
    const { data } = await api.get(`/lessons/${id}`);
    const result = data.data as { lesson: Lesson; exercises: Exercise[]; progress: LessonProgress | null };
    lessonDetailsCache.set(id, result);
    return result;
  },
  async completeExercise(lessonId: string, exerciseId: string, payload: { startTime: string; endTime: string; typedWords: TypedWord[]; variantIndex?: number }): Promise<ExerciseCompletion> {
    const { data } = await api.post(`/lessons/${lessonId}/exercises/${exerciseId}/complete`, payload);
    const completion = data.data as ExerciseCompletion;
    
    // Any passed exercise changes the Learn page's completed-exercise counts;
    // a level completion can also unlock the next lesson. Refresh the map on
    // every successful completion so the 30-second response cache stays exact.
    lessonsCache = null;
    lessonsCacheLoadedAt = 0;
    lessonsCacheGeneration += 1;
    lessonsRequest = null;
    
    return completion;
  },
};
