import api from './api';
import type { TypingResult, Achievement, SessionSubmitPayload, TestParagraph } from '../types';
interface SubmitResponse {
  result: TypingResult;
  newAchievements: Achievement[];
  xpEarned: number;
  leveledUp: boolean;
  level: number;
  newXP: number;
  levelTitle: string;
  prevXP: number;
  prevLevel: number;
  xpBreakdown?: { label: string; value: number }[];
}
interface ResultsResponse { results: TypingResult[]; total: number; page: number; pages: number; }

export const typingService = {
  async submitSession(payload: SessionSubmitPayload): Promise<SubmitResponse> {
    const { data } = await api.post('/typing/sessions', payload);
    return data.data as SubmitResponse;
  },
  async getResults(page = 1, limit = 10): Promise<ResultsResponse> {
    const { data } = await api.get(`/typing/results?page=${page}&limit=${limit}`);
    return data.data as ResultsResponse;
  },
  async getResult(id: string): Promise<TypingResult> {
    const { data } = await api.get(`/typing/results/${id}`);
    return (data.data as { result: TypingResult }).result;
  },
  async getRandomParagraph(difficulty?: string): Promise<TestParagraph> {
    const { data } = await api.get('/typing/paragraphs/random', { params: difficulty ? { difficulty } : undefined });
    return (data.data as { paragraph: TestParagraph }).paragraph;
  },
};