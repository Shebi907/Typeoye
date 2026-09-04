import { Request, Response } from 'express';
import { z } from 'zod';
import GameResult from '../models/GameResult';
import { sessionSchema } from './typing.controller';
import { processVerifiedTypingSession } from '../services/session.service';
import { sendSuccess, sendError } from '../utils/response';

const GAME_TYPES = ['typingRace', 'fallingWords', 'suddenDeath'] as const;

export const gameSchema = sessionSchema.extend({
  game: z.enum(GAME_TYPES),
  score: z.number().int().min(0).optional(),
  winner: z.enum(['user', 'opponent']).optional(),
  opponentWpm: z.number().min(1).max(500).optional(),
});

/**
 * Submits a completed game session.
 * Authed users: session saved to DB (TypingResult + GameResult), XP/achievements awarded.
 * Guests: computed stats returned without persistence.
 */
export async function completeGame(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as z.infer<typeof gameSchema>;
    const user = req.user;

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    if (startTime.getTime() >= endTime.getTime()) {
      sendError(res, 'Invalid session duration', 400);
      return;
    }

    if (user) {
      const processed = await processVerifiedTypingSession(user._id, body, startTime, endTime);
      const gameResult = await GameResult.create({
        userId: user._id,
        game: body.game,
        score: body.score ?? 0,
        wpm: processed.result.wpm,
        accuracy: processed.result.accuracy,
        duration: Math.round((endTime.getTime() - startTime.getTime()) / 1000),
        winner: body.winner,
        opponentWpm: body.opponentWpm,
      });

      sendSuccess(res, {
        result: processed.result,
        gameResult,
        newAchievements: processed.newAchievements,
        xpEarned: processed.xpEarned,
        leveledUp: processed.leveledUp,
        prevXP: processed.prevXP,
        newXP: processed.newXP,
        level: processed.level,
        levelTitle: processed.levelTitle,
        prevLevel: processed.prevLevel,
        xpBreakdown: processed.xpBreakdown,
      });
    } else {
      // Guest: compute stats client-side, return without saving
      const correctWords = body.typedWords.filter((w) => w.correct).length;
      const attemptedWords = body.typedWords.length;
      const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
      sendSuccess(res, {
        result: {
          _id: 'guest',
          sessionId: 'guest',
          userId: 'guest',
          wpm: body.clientWpm ?? 0,
          accuracy: body.clientAccuracy ?? 0,
          correctWords,
          attemptedWords,
          errorsCount: attemptedWords - correctWords,
          mode: 'game',
          createdAt: new Date().toISOString(),
        },
        gameResult: null,
        newAchievements: [],
        xpEarned: 0,
        leveledUp: false,
        prevXP: 0,
        newXP: 0,
        level: 1,
        levelTitle: 'Beginner',
        prevLevel: 1,
        xpBreakdown: [],
      });
    }
  } catch (err) {
    console.error('completeGame error:', err);
    sendError(res, 'Failed to submit game', 500);
  }
}

export async function getGameHistory(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const game = req.query['game'];
    const match: Record<string, unknown> = { userId: user._id };
    if (typeof game === 'string' && (GAME_TYPES as readonly string[]).includes(game)) {
      match.game = game;
    }
    const results = await GameResult.find(match).sort({ createdAt: -1 }).limit(50).lean();
    sendSuccess(res, { results });
  } catch (err) {
    console.error('getGameHistory error:', err);
    sendError(res, 'Failed to fetch game history', 500);
  }
}