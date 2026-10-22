import { Request, Response } from 'express';
import UrduTestParagraph, {
  UrduTestDifficulty,
  UrduTestDuration,
} from '../models/UrduTestParagraph';
import UrduPracticeItem, {
  UrduPracticeCategory,
  UrduPracticeDifficulty,
} from '../models/UrduPracticeItem';
import { sendSuccess, sendError } from '../utils/response';

const TEST_DIFFICULTIES: readonly UrduTestDifficulty[] = ['easy', 'medium', 'hard'];
const TEST_DURATIONS: readonly UrduTestDuration[] = [1, 2, 5];
const PRACTICE_CATEGORIES: readonly UrduPracticeCategory[] = [
  'characters',
  'combinations',
  'words',
  'sentences',
  'paragraphs',
];
const PRACTICE_DIFFICULTIES: readonly UrduPracticeDifficulty[] = ['easy', 'medium', 'hard'];

const adminId = (req: Request) => req.user?._id;

// ── Public content (only published/active rows ever leave the server) ────────

/**
 * Single public endpoint the client uses to hydrate its Urdu content registry.
 * Returns every active (published) Urdu test passage and Urdu practice item so
 * one request covers both the Test and Practice surfaces. Inactive/draft rows
 * are never returned.
 */
export async function getUrduContent(_req: Request, res: Response): Promise<void> {
  try {
    const [testPassages, practiceItems] = await Promise.all([
      UrduTestParagraph.find({ isActive: true })
        .select('content difficulty duration')
        .sort({ difficulty: 1, duration: 1, createdAt: 1 })
        .lean(),
      UrduPracticeItem.find({ isActive: true })
        .select('category difficulty text order')
        .sort({ category: 1, difficulty: 1, order: 1, createdAt: 1 })
        .lean(),
    ]);
    sendSuccess(res, { testPassages, practiceItems });
  } catch (err) {
    console.error('getUrduContent error:', err);
    sendError(res, 'Failed to load Urdu content', 500);
  }
}

// ── Admin: Urdu test paragraphs ──────────────────────────────────────────────

export const adminUrduTestParagraphs = {
  list: async (req: Request, res: Response): Promise<void> => {
    try {
      const query: Record<string, unknown> = {};

      const difficulty = String(req.query['difficulty'] ?? '');
      if (TEST_DIFFICULTIES.includes(difficulty as UrduTestDifficulty)) query.difficulty = difficulty;

      const duration = Number(req.query['duration']);
      if (TEST_DURATIONS.includes(duration as UrduTestDuration)) query.duration = duration;

      const status = String(req.query['status'] ?? '');
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;

      const search = String(req.query['search'] ?? '').trim();
      if (search) query.content = { $regex: search, $options: 'i' };

      const items = await UrduTestParagraph.find(query)
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();
      sendSuccess(res, { items });
    } catch (err) {
      console.error('adminUrduTestParagraphs.list error:', err);
      sendError(res, 'Failed to fetch Urdu test passages', 500);
    }
  },

  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { content, difficulty, duration, isActive = true } = req.body as {
        content: string;
        difficulty: UrduTestDifficulty;
        duration: UrduTestDuration;
        isActive?: boolean;
      };
      const item = await UrduTestParagraph.create({
        content,
        difficulty,
        duration,
        isActive,
        updatedBy: adminId(req),
      });
      sendSuccess(res, { item }, 201);
    } catch (err: any) {
      console.error('adminUrduTestParagraphs.create error:', err);
      if (err?.code === 11000) {
        sendError(res, 'An Urdu test passage with that text already exists', 409);
        return;
      }
      sendError(res, 'Failed to create Urdu test passage', 500);
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params['id'] ?? '');
      const updates: Record<string, unknown> = { updatedBy: adminId(req) };
      const { content, difficulty, duration, isActive } = req.body as {
        content?: string;
        difficulty?: UrduTestDifficulty;
        duration?: UrduTestDuration;
        isActive?: boolean;
      };
      if (typeof content === 'string') updates.content = content;
      if (TEST_DIFFICULTIES.includes(difficulty as UrduTestDifficulty)) updates.difficulty = difficulty;
      if (TEST_DURATIONS.includes(duration as UrduTestDuration)) updates.duration = duration;
      if (typeof isActive === 'boolean') updates.isActive = isActive;

      const item = await UrduTestParagraph.findByIdAndUpdate(id, updates, { new: true });
      if (!item) {
        sendError(res, 'Urdu test passage not found', 404);
        return;
      }
      sendSuccess(res, { item });
    } catch (err: any) {
      console.error('adminUrduTestParagraphs.update error:', err);
      if (err?.code === 11000) {
        sendError(res, 'An Urdu test passage with that text already exists', 409);
        return;
      }
      sendError(res, 'Failed to update Urdu test passage', 500);
    }
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params['id'] ?? '');
      const item = await UrduTestParagraph.findByIdAndDelete(id);
      if (!item) {
        sendError(res, 'Urdu test passage not found', 404);
        return;
      }
      sendSuccess(res, { message: 'Urdu test passage deleted' });
    } catch (err) {
      console.error('adminUrduTestParagraphs.remove error:', err);
      sendError(res, 'Failed to delete Urdu test passage', 500);
    }
  },
};

// ── Admin: Urdu practice items (with per-scope ordering) ─────────────────────

/** Next order value within a (category, difficulty) scope. */
async function nextPracticeOrder(
  category: UrduPracticeCategory,
  difficulty: UrduPracticeDifficulty
): Promise<number> {
  const last = await UrduPracticeItem.findOne({ category, difficulty }).sort({ order: -1 });
  return (last?.order ?? 0) + 1;
}

export const adminUrduPracticeItems = {
  list: async (req: Request, res: Response): Promise<void> => {
    try {
      const query: Record<string, unknown> = {};

      const category = String(req.query['category'] ?? '');
      if (PRACTICE_CATEGORIES.includes(category as UrduPracticeCategory)) query.category = category;

      const difficulty = String(req.query['difficulty'] ?? '');
      if (PRACTICE_DIFFICULTIES.includes(difficulty as UrduPracticeDifficulty)) {
        query.difficulty = difficulty;
      }

      const status = String(req.query['status'] ?? '');
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;

      const search = String(req.query['search'] ?? '').trim();
      if (search) query.text = { $regex: search, $options: 'i' };

      const items = await UrduPracticeItem.find(query)
        .sort({ category: 1, difficulty: 1, order: 1, createdAt: -1 })
        .limit(1000)
        .lean();
      sendSuccess(res, { items });
    } catch (err) {
      console.error('adminUrduPracticeItems.list error:', err);
      sendError(res, 'Failed to fetch Urdu practice content', 500);
    }
  },

  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, difficulty, text, isActive = true } = req.body as {
        category: UrduPracticeCategory;
        difficulty: UrduPracticeDifficulty;
        text: string;
        isActive?: boolean;
      };
      const order = await nextPracticeOrder(category, difficulty);
      const item = await UrduPracticeItem.create({
        category,
        difficulty,
        text,
        order,
        isActive,
        updatedBy: adminId(req),
      });
      sendSuccess(res, { item }, 201);
    } catch (err: any) {
      console.error('adminUrduPracticeItems.create error:', err);
      if (err?.code === 11000) {
        sendError(res, 'This Urdu practice item already exists in that category and difficulty', 409);
        return;
      }
      sendError(res, 'Failed to create Urdu practice content', 500);
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params['id'] ?? '');
      const existing = await UrduPracticeItem.findById(id);
      if (!existing) {
        sendError(res, 'Urdu practice item not found', 404);
        return;
      }

      const updates: Record<string, unknown> = { updatedBy: adminId(req) };
      const { category, difficulty, text, isActive } = req.body as {
        category?: UrduPracticeCategory;
        difficulty?: UrduPracticeDifficulty;
        text?: string;
        isActive?: boolean;
      };
      if (typeof text === 'string') updates.text = text;
      if (typeof isActive === 'boolean') updates.isActive = isActive;

      const nextCategory = PRACTICE_CATEGORIES.includes(category as UrduPracticeCategory)
        ? (category as UrduPracticeCategory)
        : existing.category;
      const nextDifficulty = PRACTICE_DIFFICULTIES.includes(difficulty as UrduPracticeDifficulty)
        ? (difficulty as UrduPracticeDifficulty)
        : existing.difficulty;

      // Moving an item to a different scope: re-seat it at the end of the new one.
      if (nextCategory !== existing.category || nextDifficulty !== existing.difficulty) {
        updates.category = nextCategory;
        updates.difficulty = nextDifficulty;
        updates.order = await nextPracticeOrder(nextCategory, nextDifficulty);
      }

      const item = await UrduPracticeItem.findByIdAndUpdate(id, updates, { new: true });
      if (!item) {
        sendError(res, 'Urdu practice item not found', 404);
        return;
      }
      sendSuccess(res, { item });
    } catch (err: any) {
      console.error('adminUrduPracticeItems.update error:', err);
      if (err?.code === 11000) {
        sendError(res, 'This Urdu practice item already exists in that category and difficulty', 409);
        return;
      }
      sendError(res, 'Failed to update Urdu practice content', 500);
    }
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params['id'] ?? '');
      const item = await UrduPracticeItem.findByIdAndDelete(id);
      if (!item) {
        sendError(res, 'Urdu practice item not found', 404);
        return;
      }
      sendSuccess(res, { message: 'Urdu practice item deleted' });
    } catch (err) {
      console.error('adminUrduPracticeItems.remove error:', err);
      sendError(res, 'Failed to delete Urdu practice content', 500);
    }
  },

  /** Reorder within the item's (category, difficulty) scope. */
  move: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params['id'] ?? '');
      const direction = req.body?.['direction'] as 'up' | 'down';
      if (direction !== 'up' && direction !== 'down') {
        sendError(res, 'Direction must be "up" or "down"', 400);
        return;
      }
      const current = await UrduPracticeItem.findById(id);
      if (!current) {
        sendError(res, 'Urdu practice item not found', 404);
        return;
      }
      const neighbor = await UrduPracticeItem.findOne({
        category: current.category,
        difficulty: current.difficulty,
        order: direction === 'up' ? { $lt: current.order } : { $gt: current.order },
      }).sort({ order: direction === 'up' ? -1 : 1 });
      if (!neighbor) {
        sendError(res, `Already at the ${direction === 'up' ? 'top' : 'bottom'}.`, 400);
        return;
      }
      const oldSelf = current.order;
      const oldNeighbor = neighbor.order;
      current.order = -1;
      await current.save();
      neighbor.order = oldSelf;
      await neighbor.save();
      current.order = oldNeighbor;
      await current.save();
      sendSuccess(res, { message: 'Reordered' });
    } catch (err) {
      console.error('adminUrduPracticeItems.move error:', err);
      sendError(res, 'Failed to reorder Urdu practice content', 500);
    }
  },
};
