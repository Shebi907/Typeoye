import api from './api';
import type { AnalyticsTrend, DashboardData, HistorySession, ProgressData, WeakKey, UserProgress, Streak } from '../types';

// Module-level caches so navigations back to the progress page render full
// content on the very first frame (refreshed in the background each visit).
// The Urdu caches are kept separate so switching between the English and Urdu
// progress pages never shows the other course's data.
let progressCache: ProgressData | null = null;
let accuracyTrendCache: AnalyticsTrend[] | null = null;
let urduProgressCache: ProgressData | null = null;
let urduAccuracyTrendCache: AnalyticsTrend[] | null = null;

export const analyticsService = {
  clearCache(): void {
    progressCache = null;
    accuracyTrendCache = null;
    urduProgressCache = null;
    urduAccuracyTrendCache = null;
  },
  getProgressCached(): ProgressData | null { return progressCache; },
  getAccuracyTrendCached(): AnalyticsTrend[] | null { return accuracyTrendCache; },
  getUrduProgressCached(): ProgressData | null { return urduProgressCache; },
  getUrduAccuracyTrendCached(): AnalyticsTrend[] | null { return urduAccuracyTrendCache; },
  async getWpmTrend(): Promise<AnalyticsTrend[]> { const { data } = await api.get('/analytics/wpm-trend'); return (data.data as { trend: AnalyticsTrend[] }).trend; },
  async getAccuracyTrend(): Promise<AnalyticsTrend[]> {
    if (accuracyTrendCache) return accuracyTrendCache;
    const { data } = await api.get('/analytics/accuracy-trend');
    accuracyTrendCache = (data.data as { trend: AnalyticsTrend[] }).trend;
    return accuracyTrendCache;
  },
  async getUrduAccuracyTrend(): Promise<AnalyticsTrend[]> {
    if (urduAccuracyTrendCache) return urduAccuracyTrendCache;
    const { data } = await api.get('/analytics/accuracy-trend?language=ur');
    urduAccuracyTrendCache = (data.data as { trend: AnalyticsTrend[] }).trend;
    return urduAccuracyTrendCache;
  },
  async getWeakKeys(): Promise<WeakKey[]> { const { data } = await api.get('/analytics/weak-keys'); return (data.data as { weakKeys: WeakKey[] }).weakKeys; },
  async getSummary(): Promise<{ progress: UserProgress; streak: Streak }> { const { data } = await api.get('/analytics/summary'); return data.data as { progress: UserProgress; streak: Streak }; },
  async getDashboard(): Promise<DashboardData> { const { data } = await api.get('/analytics/dashboard'); return data.data as DashboardData; },
  async getProgress(): Promise<ProgressData> {
    if (progressCache) return progressCache;
    const { data } = await api.get('/analytics/progress');
    progressCache = data.data as ProgressData;
    return progressCache;
  },
  async getUrduProgress(): Promise<ProgressData> {
    if (urduProgressCache) return urduProgressCache;
    const { data } = await api.get('/analytics/progress/urdu');
    urduProgressCache = data.data as ProgressData;
    return urduProgressCache;
  },
  async getHistory(filters: { page: number; type?: string; mode?: string; from?: string; to?: string }): Promise<{ sessions: HistorySession[]; page: number; pages: number; total: number }> { const params = new URLSearchParams({ page: String(filters.page), limit: '10' }); Object.entries(filters).forEach(([key, value]) => { if (key !== 'page' && value) params.set(key, String(value)); }); const { data } = await api.get(`/analytics/history?${params}`); return data.data; },
};