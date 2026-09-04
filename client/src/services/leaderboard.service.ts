import api from './api';
import type { LeaderboardPeriod, LeaderboardResponse } from '../types';

// Module-level cache to prevent flashing on navigation
let leaderboardCache: Record<string, LeaderboardResponse> = {};

export const leaderboardService = {
  clearCache(): void {
    leaderboardCache = {};
  },

  getLeaderboardCached(period: LeaderboardPeriod): LeaderboardResponse | null {
    return leaderboardCache[period] || null;
  },

  async getLeaderboard(
    period: LeaderboardPeriod = 'global',
    limit = 50
  ): Promise<LeaderboardResponse> {
    const { data } = await api.get(`/leaderboard?period=${period}&limit=${limit}`);
    leaderboardCache[period] = data.data as LeaderboardResponse;
    return leaderboardCache[period];
  },
};