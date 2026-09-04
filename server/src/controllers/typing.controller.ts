import { Request, Response } from 'express';
import { z } from 'zod';
import TypingResult from '../models/TypingResult';
import { processVerifiedTypingSession } from '../services/session.service';
import { sendSuccess, sendError } from '../utils/response';
import TestParagraph from '../models/TestParagraph';

export const sessionSchema = z.object({
  mode: z.enum(['test', 'practice', 'lesson', 'game']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  typedWords: z
    .array(
      z.object({
        word: z.string(),
        typed: z.string(),
        correct: z.boolean(),
        timeTakenMs: z.number().min(0),
      })
    )
    .min(1),
  textSource: z.enum(['generated', 'lesson', 'custom']),
  exerciseId: z.string().optional(),
  clientWpm: z.number().optional().default(0),
  clientAccuracy: z.number().optional().default(0),
  practiceType: z.string().optional(),
  practiceDifficulty: z.number().int().min(1).max(3).optional(),
  focusKeys: z.array(z.string().min(1).max(1)).max(8).optional(),
});

export async function getRandomParagraph(req: Request, res: Response): Promise<void> {
  try {
    const difficulty = req.query['difficulty'];
    const match = typeof difficulty === 'string' && ['beginner', 'intermediate', 'advanced'].includes(difficulty) ? { difficulty } : {};
    const [paragraph] = await TestParagraph.aggregate([{ $match: match }, { $sample: { size: 1 } }]);
    if (!paragraph) { sendError(res, 'No test paragraphs are available. Run the database seed first.', 404); return; }
    sendSuccess(res, { paragraph });
  } catch (err) {
    console.error('getRandomParagraph error:', err);
    sendError(res, 'Failed to load a test paragraph', 500);
  }
}
export async function submitSession(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const body = req.body as z.infer<typeof sessionSchema>;

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

if (durationSeconds <= 0) {
      sendError(res, 'Invalid session duration', 400);
      return;
    }

    const {
      result,
      newAchievements,
      xpEarned,
      leveledUp,
      prevXP,
      newXP,
      level,
      prevLevel,
      levelTitle,
      xpBreakdown,
    } = await processVerifiedTypingSession(user._id, body, startTime, endTime);

    sendSuccess(res, {
      result,
      newAchievements,
      xpEarned,
      leveledUp,
      prevXP,
      newXP,
      level,
      levelTitle,
      prevLevel,
      xpBreakdown,
    });
  } catch (err) {
    console.error('submitSession error:', err);
    sendError(res, err instanceof Error && (err as any).statusCode === 400 ? err.message : 'Failed to submit session', err instanceof Error && (err as any).statusCode === 400 ? 400 : 500);
  }
}

export async function getResults(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const limit = Math.min(50, parseInt(req.query['limit'] as string) || 10);
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      TypingResult.find({ userId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      TypingResult.countDocuments({ userId: user._id }),
    ]);

    sendSuccess(res, { results, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getResults error:', err);
    sendError(res, 'Failed to fetch results', 500);
  }
}

export async function getResult(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const result = await TypingResult.findById(req.params['id']);
    if (!result) {
      sendError(res, 'Result not found', 404);
      return;
    }
    if (!result.userId || result.userId.toString() !== user._id.toString()) {
      sendError(res, 'Unauthorized', 403);
      return;
    }
    sendSuccess(res, { result });
  } catch (err) {
    console.error('getResult error:', err);
    sendError(res, 'Failed to fetch result', 500);
  }
}
