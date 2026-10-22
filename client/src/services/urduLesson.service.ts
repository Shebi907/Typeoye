import api from './api';
import type { CourseLesson, Exercise, Lesson, LessonProgress, TypedWord } from '../types';
import type { ExerciseCompletion } from './lesson.service';

/**
 * Urdu course service. Mirrors `lessonService` but talks to `/urdu-lessons`
 * and keeps its own module-level caches, so the English and Urdu courses never
 * share cached state.
 */

let lessonsCache: CourseLesson[] | null = null;
let lessonsRequest: Promise<CourseLesson[]> | null = null;
let lessonsCacheLoadedAt = 0;
let lessonsCacheGeneration = 0;
const LESSONS_CACHE_TTL_MS = 30_000;
const lessonDetailsCache = new Map<string, { lesson: Lesson; exercises: Exercise[]; progress: LessonProgress | null }>();

/**
 * Guest variant-repeat avoidance. Authed users get an unseen variant picked
 * server-side and stored on their LessonProgress; guests have no server
 * progress, so we remember which variant indices they have already been shown
 * per (lesson, exercise) in localStorage. This makes guest opens pick unseen
 * text and persist across navigation and page refreshes.
 */
const GUEST_SEEN_PREFIX = 'urdu_seen_';
function guestSeenKey(lessonId: string, exerciseOrder: number): string {
  return `${GUEST_SEEN_PREFIX}${lessonId}_${exerciseOrder}`;
}
export function getGuestSeenIndices(lessonId: string, exerciseOrder: number): number[] {
  try {
    const raw = localStorage.getItem(guestSeenKey(lessonId, exerciseOrder));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number' && n >= 0) : [];
  } catch {
    return [];
  }
}
function setGuestSeenIndices(lessonId: string, exerciseOrder: number, indices: number[]): void {
  try {
    localStorage.setItem(guestSeenKey(lessonId, exerciseOrder), JSON.stringify(indices));
  } catch {
    /* storage unavailable (private mode) — fall back to plain random picks */
  }
}
/**
 * Picks a variant index the guest has not been shown yet, records it as seen,
 * and reshuffles (restarts) once the whole pool has been exhausted.
 */
export function pickGuestVariantIndex(lessonId: string, exerciseOrder: number, variantCount: number): number {
  if (variantCount <= 1) return 0;
  const seen = getGuestSeenIndices(lessonId, exerciseOrder);
  const unseen = Array.from({ length: variantCount }, (_, i) => i).filter((i) => !seen.includes(i));
  let choice: number;
  let nextSeen: number[];
  if (unseen.length > 0) {
    choice = unseen[Math.floor(Math.random() * unseen.length)];
    nextSeen = [...seen, choice];
  } else {
    choice = Math.floor(Math.random() * variantCount);
    nextSeen = [choice];
  }
  setGuestSeenIndices(lessonId, exerciseOrder, nextSeen);
  return choice;
}

export const urduLessonService = {
  clearCache(): void {
    lessonsCache = null;
    lessonsCacheLoadedAt = 0;
    lessonsCacheGeneration += 1;
    lessonsRequest = null;
    lessonDetailsCache.clear();
  },
  pickGuestVariantIndex,
  getGuestSeenIndices,
  getLessonsCached(): CourseLesson[] | null {
    return lessonsCache;
  },
  async getLessons(): Promise<CourseLesson[]> {
    if (lessonsCache && Date.now() - lessonsCacheLoadedAt < LESSONS_CACHE_TTL_MS) return lessonsCache;
    if (!lessonsRequest) {
      const generation = lessonsCacheGeneration;
      lessonsRequest = api
        .get('/urdu-lessons')
        .then(({ data }) => {
          const result = data?.data?.lessons;
          if (!Array.isArray(result) || result.some((lesson: unknown) => {
            const item = lesson as Partial<CourseLesson> | null;
            return !item || typeof item._id !== 'string' || typeof item.category !== 'string'
              || typeof item.completed !== 'boolean' || typeof item.completedExercises !== 'number'
              || typeof item.exerciseCount !== 'number';
          })) {
            throw new Error('The Urdu lessons response was incomplete. Please try again.');
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
    const { data } = await api.get(`/urdu-lessons/${id}`);
    const result = data.data as { lesson: Lesson; exercises: Exercise[]; progress: LessonProgress | null };
    lessonDetailsCache.set(id, result);
    return result;
  },
  async completeExercise(lessonId: string, exerciseId: string, payload: { startTime: string; endTime: string; typedWords: TypedWord[]; variantIndex?: number }): Promise<ExerciseCompletion> {
    const { data } = await api.post(`/urdu-lessons/${lessonId}/exercises/${exerciseId}/complete`, payload);
    const completion = data.data as ExerciseCompletion;
    // Keep the per-level cache aligned with the server's canonical progress so
    // navigating away and reopening this level resumes from the next exercise.
    const cached = lessonDetailsCache.get(lessonId);
    if (cached) lessonDetailsCache.set(lessonId, { ...cached, progress: completion.progress });
    lessonsCache = null;
    lessonsCacheLoadedAt = 0;
    lessonsCacheGeneration += 1;
    lessonsRequest = null;
    return completion;
  },
};
