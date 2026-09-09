import { Request, Response } from 'express';
import CertificateParagraph, { CertificateParagraphDifficulty } from '../models/CertificateParagraph';
import User from '../models/User';
import TypingSession from '../models/TypingSession';
import {
  selectCertificateParagraph,
  parseExcludeQuery,
} from '../services/certificateParagraph.service';
import { sendSuccess, sendError } from '../utils/response';

function readDifficulty(raw: unknown): CertificateParagraphDifficulty {
  return raw === 'medium' || raw === 'hard' ? raw : 'easy';
}

/**
 * Public certificate-test paragraph endpoint (signed-in visitors get persistent
 * history, guests pass `?exclude=` with their localStorage history). Never
 * returns inactive paragraphs, never repeats until the pool cycles, and errors
 * (503) instead of ever sending an empty test.
 */
export async function getCertificateParagraph(req: Request, res: Response): Promise<void> {
  try {
    const difficulty = readDifficulty(req.query.difficulty);
    const user = req.user ?? null;
    const exclude = parseExcludeQuery(req.query.exclude);

    const paragraph = await selectCertificateParagraph({ user, difficulty, exclude });
    if (!paragraph) {
      sendError(res, 'No certificate content available for this difficulty', 503);
      return;
    }
    sendSuccess(res, {
      paragraph: {
        _id: paragraph._id,
        content: paragraph.content,
        difficulty: paragraph.difficulty,
      },
    });
  } catch (err) {
    console.error('getCertificateParagraph error:', err);
    sendError(res, 'Failed to load certificate content', 500);
  }
}

// ── Admin library management (routes are protected by authenticate + requireAdmin) ──

export const adminCertificateParagraphs = {
  list: async (req: Request, res: Response): Promise<void> => {
    try {
      const query: Record<string, unknown> = {};

      const difficulty = String(req.query['difficulty'] ?? '');
      if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
        query.difficulty = difficulty;
      }

      const status = String(req.query['status'] ?? '');
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;

      const search = String(req.query['search'] ?? '').trim();
      if (search) query.content = { $regex: search, $options: 'i' };

      const items = await CertificateParagraph.find(query).sort({ createdAt: -1 }).limit(500).lean();
      sendSuccess(res, { items });
    } catch (err) {
      console.error('certificateParagraphs.list error:', err);
      sendError(res, 'Failed to fetch certificate paragraphs', 500);
    }
  },

  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { content, difficulty, isActive = true } = req.body as {
        content: string;
        difficulty: CertificateParagraphDifficulty;
        isActive?: boolean;
      };
      const item = await CertificateParagraph.create({
        content,
        difficulty,
        isActive,
        updatedBy: req.user?._id,
      });
      sendSuccess(res, { item }, 201);
    } catch (err: any) {
      console.error('certificateParagraphs.create error:', err);
      if (err?.code === 11000) {
        sendError(res, 'A certificate paragraph with that text already exists', 409);
        return;
      }
      sendError(res, 'Failed to create certificate paragraph', 500);
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params['id'] ?? '');
      const updates: Record<string, unknown> = { updatedBy: req.user?._id };
      const { content, difficulty, isActive } = req.body as {
        content?: string;
        difficulty?: CertificateParagraphDifficulty;
        isActive?: boolean;
      };
      if (typeof content === 'string') updates.content = content;
      if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
        updates.difficulty = difficulty;
      }
      if (typeof isActive === 'boolean') updates.isActive = isActive;

      const item = await CertificateParagraph.findByIdAndUpdate(id, updates, { new: true });
      if (!item) {
        sendError(res, 'Certificate paragraph not found', 404);
        return;
      }
      sendSuccess(res, { item });
    } catch (err: any) {
      console.error('certificateParagraphs.update error:', err);
      if (err?.code === 11000) {
        sendError(res, 'A certificate paragraph with that text already exists', 409);
        return;
      }
      sendError(res, 'Failed to update certificate paragraph', 500);
    }
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params['id'] ?? '');

      const [referencedByUser, referencedBySession] = await Promise.all([
        User.exists({ 'certificateParagraphHistory.paragraphId': id }),
        TypingSession.exists({ certificateParagraphId: id }),
      ]);
      if (referencedByUser || referencedBySession) {
        sendError(
          res,
          'This paragraph is referenced by user history or completed tests. Disable it instead of deleting.',
          409
        );
        return;
      }

      const item = await CertificateParagraph.findByIdAndDelete(id);
      if (!item) {
        sendError(res, 'Certificate paragraph not found', 404);
        return;
      }
      sendSuccess(res, { message: 'Certificate paragraph deleted' });
    } catch (err) {
      console.error('certificateParagraphs.remove error:', err);
      sendError(res, 'Failed to delete certificate paragraph', 500);
    }
  },
};