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
const lessonDetailsCache = new Map<string, { lesson: Lesson; exercises: Exercise[]; progress: LessonProgress | null }>();

export const lessonService = {
  clearCache(): void {
    lessonsCache = null;
    lessonsRequest = null;
  },
  /** Synchronous access to already-fetched lessons (null until first fetch). */
  getLessonsCached(): CourseLesson[] | null {
    return lessonsCache;
  },
  async getLessons(): Promise<CourseLesson[]> {
    if (lessonsCache) return lessonsCache;
    if (!lessonsRequest) {
      lessonsRequest = api
        .get('/lessons')
        .then(({ data }) => {
          lessonsCache = (data.data as { lessons: CourseLesson[] }).lessons;
          return lessonsCache;
        })
        .finally(() => {
          lessonsRequest = null;
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
    
    // If a new lesson was unlocked, invalidate the cache so the Learn page
    // refetches the course map and shows the next level as unlocked.
    if (completion.nextLessonUnlocked) {
      lessonsCache = null;
    }
    
    return completion;
  },
};