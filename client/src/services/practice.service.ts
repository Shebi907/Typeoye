import api from './api';
import type { PracticeExercise, PracticeRecommendation, PracticeToday, PracticeType, WeakKey } from '../types';
import { useAuthStore } from '../store/authStore';

let preloadCache: { key: string; exercise: PracticeExercise } | null = null;
let preloadRequestId = 0;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isTransientServerFailure(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function parsePracticeExercise(data: unknown): PracticeExercise {
  const exercise = (data as { data?: { exercise?: unknown } } | null)?.data?.exercise;
  if (!exercise || typeof exercise !== 'object') throw new Error('The server returned invalid practice content. Please try again.');
  const value = exercise as Partial<PracticeExercise>;
  if (typeof value.content !== 'string' || !value.content.trim() ||
      !['character', 'combination', 'word', 'sentence', 'paragraph', 'weak', 'quick', 'custom'].includes(value.type ?? '') ||
      !['beginner', 'intermediate', 'advanced'].includes(value.difficulty ?? '') ||
      !Array.isArray(value.focusKeys) || (value.queue != null && (!Array.isArray(value.queue) || value.queue.some((item) => typeof item !== 'string')))) {
    throw new Error('The server returned empty or invalid practice content. Please try again.');
  }
  return { ...value, content: value.content.trim() } as PracticeExercise;
}

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
    preloadRequestId += 1;
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
    for (let attempt = 0; ; attempt += 1) {
      try {
        const { data } = await api.get(`/practice/generate?${params}`);
        return parsePracticeExercise(data);
      } catch (error) {
        if (attempt >= 1 || !isTransientServerFailure(error)) throw error;
        await wait(500 * (attempt + 1));
      }
    }
  },
  async preload(options: { type: PracticeType; difficulty: string; duration: number; wordCount?: number; customText?: string }): Promise<void> {
    const key = preloadKey(options);
    const requestId = ++preloadRequestId;
    try {
      const exercise = await this.generate({ ...options, wordCount: options.wordCount ?? 200, session: true });
      if (requestId === preloadRequestId && key === preloadKey(options)) preloadCache = { key, exercise };
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
