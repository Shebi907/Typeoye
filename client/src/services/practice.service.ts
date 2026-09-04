import api from './api';
import type { PracticeExercise, PracticeRecommendation, PracticeToday, PracticeType, WeakKey } from '../types';
import { useAuthStore } from '../store/authStore';

let preloadCache: { key: string; exercise: PracticeExercise } | null = null;

const rotationKey = (scope: string, type: string, difficulty: string) => `typeoye.practice.rotation.${scope}.${type}.${difficulty}`;
const scope = () => useAuthStore.getState().user?._id ?? 'guest';

const getRotation = (type: string, difficulty: string): number => {
  try {
    const n = Number(localStorage.getItem(rotationKey(scope(), type, difficulty)));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
};

const commitRotation = (exercise: PracticeExercise): void => {
  if (exercise.type === 'custom') return;
  try {
    const rot = exercise.rotation ?? getRotation(exercise.type, exercise.difficulty);
    const advance = 1 + (exercise.queue?.length ?? 0);
    const next = exercise.poolLength ? (rot + advance) % exercise.poolLength : rot + advance;
    localStorage.setItem(rotationKey(scope(), exercise.type, exercise.difficulty), String(next));
  } catch {
    // no-op
  }
};

const preloadKey = (options: { type: PracticeType; difficulty: string; duration: number; customText?: string }) =>
  `${options.type}|${options.difficulty}|${options.duration}|${options.customText ?? ''}|${getRotation(options.type, options.difficulty)}`;

export const practiceService = {
  clearCache(): void {
    preloadCache = null;
  },
  async getOverview(): Promise<{ weakKeys: WeakKey[]; today: PracticeToday; recommendation: PracticeRecommendation }> { const { data } = await api.get('/practice/overview'); return data.data; },
  async generate(options: { type: PracticeType; difficulty: string; duration: number; targetKeys?: string[]; wordCount?: number; customText?: string; session?: boolean }): Promise<PracticeExercise> {
    const params = new URLSearchParams({
      type: options.type,
      difficulty: options.difficulty,
      duration: String(options.duration),
      wordCount: String(options.wordCount ?? 60),
      rotation: String(getRotation(options.type, options.difficulty)),
    });
    if (options.targetKeys?.length) params.set('targetKeys', options.targetKeys.join(',')); if (options.customText) params.set('customText', options.customText); if (options.session) params.set('session', '1');
    const { data } = await api.get(`/practice/generate?${params}`); return data.data.exercise as PracticeExercise;
  },
  async preload(options: { type: PracticeType; difficulty: string; duration: number; wordCount?: number; customText?: string }): Promise<void> {
    const key = preloadKey(options);
    try {
      const exercise = await this.generate({ ...options, wordCount: options.wordCount ?? 200, session: true });
      if (key === preloadKey(options)) preloadCache = { key, exercise };
    } catch {
      // Best-effort preload — the session falls back to its own fetch if it fails.
    }
  },
  getPreloaded(options: { type: PracticeType; difficulty: string; duration: number; customText?: string }): PracticeExercise | null {
    const key = preloadKey(options);
    return preloadCache?.key === key ? preloadCache.exercise : null;
  },
  commitRotation,
};