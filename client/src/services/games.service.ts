import api from './api';
import type { GameResult, GameType, SessionRewards, TypingResult, SessionSubmitPayload } from '../types';

export interface GameCompletePayload extends SessionSubmitPayload {
  game: GameType;
  score?: number;
  winner?: 'user' | 'opponent';
  opponentWpm?: number;
}

export interface GameSubmitResponse extends SessionRewards {
  winner?: 'user' | 'opponent';
  result: TypingResult;
  gameResult: GameResult;
}

export const gamesService = {
  async completeGame(payload: GameCompletePayload): Promise<GameSubmitResponse> {
    const { data } = await api.post('/games/complete', payload);
    return data.data as GameSubmitResponse;
  },
  async getHistory(game?: GameType): Promise<GameResult[]> {
    const { data } = await api.get(`/games/history${game ? `?game=${game}` : ''}`);
    return (data.data as { results: GameResult[] }).results;
  },
};