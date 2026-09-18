import api from './api';
import type { ChallengePublic } from '../types/challenge';

export const challengeService = {
  async create(durationSeconds?: number): Promise<ChallengePublic> {
    const { data } = await api.post('/challenge', { durationSeconds });
    return (data.data as { challenge: ChallengePublic }).challenge;
  },

  async get(code: string): Promise<ChallengePublic> {
    const { data } = await api.get(`/challenge/${code}`);
    return (data.data as { challenge: ChallengePublic }).challenge;
  },

  async join(code: string): Promise<ChallengePublic> {
    const { data } = await api.post(`/challenge/${code}/join`);
    return (data.data as { challenge: ChallengePublic }).challenge;
  },

  async ready(code: string): Promise<{ challenge: ChallengePublic; bothReady: boolean }> {
    const { data } = await api.post(`/challenge/${code}/ready`);
    return data.data as { challenge: ChallengePublic; bothReady: boolean };
  },

  async submitResults(
    code: string,
    payload: { round: number; startTime: string; endTime: string; typedWords: { word: string; typed: string; correct: boolean; timeTakenMs: number }[] }
  ): Promise<{ challenge: ChallengePublic; final: boolean }> {
    const { data } = await api.post(`/challenge/${code}/results`, payload);
    return data.data as { challenge: ChallengePublic; final: boolean };
  },

  async rematch(code: string): Promise<{ challenge: ChallengePublic; advanced: boolean }> {
    const { data } = await api.post(`/challenge/${code}/rematch`);
    return data.data as { challenge: ChallengePublic; advanced: boolean };
  },

  async leave(code: string): Promise<ChallengePublic> {
    const { data } = await api.post(`/challenge/${code}/leave`);
    return (data.data as { challenge: ChallengePublic }).challenge;
  },
};