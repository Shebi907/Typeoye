import api from './api';
import type {
  AdminAchievement,
  AdminExerciseInput,
  AdminLesson,
  AdminLessonInput,
  AdminStats,
  AdminUser,
  ContentDifficulty,
  ContentItem,
  PlatformSettings,
} from '../types';

const unwrap = <T,>(promise: Promise<{ data: { success: boolean; data: T } }>): Promise<T> =>
  promise.then((res) => res.data.data);

// ── Dashboard ────────────────────────────────────────────────────────────
export const getAdminStats = () => unwrap<AdminStats>(api.get('/admin/stats'));

// ── Users ────────────────────────────────────────────────────────────────
export const listUsers = (params: { search?: string; role?: string } = {}) =>
  unwrap<{ users: AdminUser[] }>(api.get('/admin/users', { params }));

export const getUser = (id: string) =>
  unwrap<{ user: AdminUser }>(api.get(`/admin/users/${id}`));

export const setUserRole = (id: string, role: 'user' | 'admin') =>
  unwrap<{ user: AdminUser }>(api.patch(`/admin/users/${id}/role`, { role }));

// ── Lessons ──────────────────────────────────────────────────────────────
export const listLessons = () => unwrap<{ lessons: AdminLesson[] }>(api.get('/admin/lessons'));
export const createLesson = (data: AdminLessonInput) =>
  unwrap<{ lesson: AdminLesson }>(api.post('/admin/lessons', data));
export const updateLesson = (id: string, data: Partial<AdminLessonInput>) =>
  unwrap<{ lesson: AdminLesson }>(api.patch(`/admin/lessons/${id}`, data));
export const deleteLesson = (id: string) =>
  unwrap<{ message: string }>(api.delete(`/admin/lessons/${id}`));
export const reorderLessons = (orderedIds: string[]) =>
  unwrap<{ message: string }>(api.post('/admin/lessons/reorder', { orderedIds }));
export const moveLesson = (id: string, direction: 'up' | 'down') =>
  unwrap<{ message: string }>(api.patch(`/admin/lessons/${id}/move`, { direction }));

// ── Exercises ────────────────────────────────────────────────────────────
export const listExercises = (lessonId: string) =>
  unwrap<{ exercises: import('../types').Exercise[] }>(api.get(`/admin/lessons/${lessonId}/exercises`));
export const createExercise = (lessonId: string, data: AdminExerciseInput) =>
  unwrap<{ exercise: import('../types').Exercise }>(api.post(`/admin/lessons/${lessonId}/exercises`, data));
export const updateExercise = (id: string, data: Partial<AdminExerciseInput>) =>
  unwrap<{ exercise: import('../types').Exercise }>(api.patch(`/admin/exercises/${id}`, data));
export const deleteExercise = (id: string) =>
  unwrap<{ message: string }>(api.delete(`/admin/exercises/${id}`));
export const reorderExercises = (orderedIds: string[]) =>
  unwrap<{ message: string }>(api.post('/admin/exercises/reorder', { orderedIds }));
export const moveExercise = (id: string, direction: 'up' | 'down') =>
  unwrap<{ message: string }>(api.patch(`/admin/exercises/${id}/move`, { direction }));

// ── Achievements ─────────────────────────────────────────────────────────
export const listAchievements = () =>
  unwrap<{ achievements: AdminAchievement[] }>(api.get('/admin/achievements'));
export const createAchievement = (data: Partial<AdminAchievement>) =>
  unwrap<{ achievement: AdminAchievement }>(api.post('/admin/achievements', data));
export const updateAchievement = (id: string, data: Partial<AdminAchievement>) =>
  unwrap<{ achievement: AdminAchievement }>(api.patch(`/admin/achievements/${id}`, data));
export const deleteAchievement = (id: string) =>
  unwrap<{ message: string }>(api.delete(`/admin/achievements/${id}`));

// ── Content pools ────────────────────────────────────────────────────────
export type ContentPoolKey = 'testParagraphs' | 'practiceParagraphs' | 'words' | 'sentences';

const poolPaths: Record<ContentPoolKey, string> = {
  testParagraphs: '/admin/test-paragraphs',
  practiceParagraphs: '/admin/practice-paragraphs',
  words: '/admin/words',
  sentences: '/admin/sentences',
};

export const listPool = (key: ContentPoolKey, difficulty?: ContentDifficulty) =>
  unwrap<{ items: ContentItem[] }>(api.get(poolPaths[key], { params: difficulty ? { difficulty } : {} }));

export const createPoolItem = (key: ContentPoolKey, data: Partial<ContentItem>) =>
  unwrap<{ item: ContentItem }>(api.post(poolPaths[key], data));

export const updatePoolItem = (key: ContentPoolKey, id: string, data: Partial<ContentItem>) =>
  unwrap<{ item: ContentItem }>(api.patch(`${poolPaths[key]}/${id}`, data));

export const deletePoolItem = (key: ContentPoolKey, id: string) =>
  unwrap<{ message: string }>(api.delete(`${poolPaths[key]}/${id}`));

// ── Platform settings ────────────────────────────────────────────────────
export const getPlatformSettings = () =>
  unwrap<{ settings: PlatformSettings; defaults: Partial<PlatformSettings> }>(api.get('/admin/settings'));
export const updatePlatformSettings = (settings: Partial<PlatformSettings>) =>
  unwrap<{ settings: PlatformSettings }>(api.patch('/admin/settings', { settings }));