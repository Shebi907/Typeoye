import api from './api';
import type { TypingResult, Achievement, SessionSubmitPayload, TestParagraph } from '../types';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isTransientServerFailure(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function parseRandomParagraph(data: unknown): TestParagraph {
  const paragraph = (data as { data?: { paragraph?: unknown } } | null)?.data?.paragraph;
  if (!paragraph || typeof paragraph !== 'object') throw new Error('The server returned invalid typing text. Please try again.');
  const value = paragraph as Partial<TestParagraph>;
  if (typeof value._id !== 'string' || typeof value.content !== 'string' || !value.content.trim() ||
      !['beginner', 'intermediate', 'advanced'].includes(value.difficulty ?? '') || typeof value.topic !== 'string') {
    throw new Error('The server returned empty or invalid typing text. Please try again.');
  }
  return value as TestParagraph;
}
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
    for (let attempt = 0; ; attempt += 1) {
      try {
        const { data } = await api.get('/typing/paragraphs/random', { params: difficulty ? { difficulty } : undefined });
        return parseRandomParagraph(data);
      } catch (error) {
        if (attempt >= 1 || !isTransientServerFailure(error)) {
          console.warn('[typing] text request failed', {
            path: '/typing/paragraphs/random',
            difficulty: difficulty ?? 'any',
            status: (error as { response?: { status?: number } })?.response?.status ?? null,
            attempts: attempt + 1,
          });
          throw error;
        }
        await wait(500 * (attempt + 1));
      }
    }
  },
};
