import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Lesson from '../models/Lesson';
import Exercise from '../models/Exercise';
import Achievement from '../models/Achievement';
import User from '../models/User';
import TypingResult from '../models/TypingResult';
import TestParagraph from '../models/TestParagraph';
import PracticeParagraph from '../models/PracticeParagraph';
import Word from '../models/Word';
import Sentence from '../models/Sentence';
import PlatformSetting from '../models/PlatformSetting';
import LessonProgress from '../models/LessonProgress';
import UserAchievement from '../models/UserAchievement';
import { sendSuccess, sendError } from '../utils/response';
import { sendEmail } from '../services/emailService';

export const testEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return sendError(res, 'Recipient email is required.', 400);
  }
  
  try {
    await sendEmail({
      to: email,
      subject: 'Typeoye Test Email',
      html: '<p>Hello! This is a test email from Typeoye.</p><p>Resend email integration is working successfully.</p>',
    });
    
    sendSuccess(res, { message: 'Test email sent successfully' }, 200);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to send test email', 500);
  }
};

const adminId = (req: Request) => req.user?._id as mongoose.Types.ObjectId | undefined;

// ── Shared helpers ───────────────────────────────────────────────────────────


/** Per-user typing stats summary (sessions, best WPM, avg accuracy). */
async function userStatsMap(): Promise<Map<string, { sessions: number; bestWpm: number; avgAccuracy: number }>> {
  const rows = await TypingResult.aggregate([
    { $group: { _id: '$userId', sessions: { $sum: 1 }, bestWpm: { $max: '$wpm' }, avgAccuracy: { $avg: '$accuracy' } } },
  ]);
  const map = new Map<string, { sessions: number; bestWpm: number; avgAccuracy: number }>();
  for (const row of rows) {
    map.set(String(row._id), {
      sessions: row.sessions,
      bestWpm: Math.round(row.bestWpm),
      avgAccuracy: Math.round(row.avgAccuracy * 10) / 10,
    });
  }
  return map;
}

async function singleUserStats(userId: unknown) {
  const rows = await TypingResult.aggregate([
    { $match: { userId } },
    { $group: { _id: null, sessions: { $sum: 1 }, bestWpm: { $max: '$wpm' }, avgAccuracy: { $avg: '$accuracy' } } },
  ]);
  const row = rows[0];
  return row
    ? { sessions: row.sessions, bestWpm: Math.round(row.bestWpm), avgAccuracy: Math.round(row.avgAccuracy * 10) / 10 }
    : { sessions: 0, bestWpm: 0, avgAccuracy: 0 };
}

/**
 * Reassign a 1-based `field` across a model so the full ordered list is
 * contiguous. Uses a temporary negative pass first to avoid unique-index
 * collisions (Lesson.order is unique).
 */
async function applyOrder(
  model: mongoose.Model<any>,
  orderedIds: string[],
  field: 'order'
): Promise<boolean> {
  const found = await model.countDocuments({ _id: { $in: orderedIds } });
  if (found !== orderedIds.length) return false;
  for (let i = 0; i < orderedIds.length; i++) {
    await model.updateOne({ _id: orderedIds[i] }, { $set: { [field]: -(i + 1000) } });
  }
  await Promise.all(
    orderedIds.map((id, i) => model.updateOne({ _id: id }, { $set: { [field]: i + 1 } }))
  );
  return true;
}

async function nextOrder(model: mongoose.Model<any>, query: Record<string, unknown>): Promise<number> {
  const last = await model.findOne(query).sort({ order: -1 });
  return (last?.order ?? 0) + 1;
}

/** Swap the order values of two documents without tripping a unique index. */
async function swapOrders(
  model: mongoose.Model<any>,
  current: { _id: mongoose.Types.ObjectId; order: number },
  neighbor: { _id: mongoose.Types.ObjectId; order: number }
): Promise<void> {
  const oldSelf = current.order;
  const oldNeighbor = neighbor.order;
  await model.updateOne({ _id: current._id }, { $set: { order: -1 } });
  await model.updateOne({ _id: neighbor._id }, { $set: { order: oldSelf } });
  await model.updateOne({ _id: current._id }, { $set: { order: oldNeighbor } });
}

function moveOne(
  model: mongoose.Model<any>,
  scope: (item: { _id: mongoose.Types.ObjectId; order: number; [k: string]: unknown }) => Record<string, unknown>
) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'];
      const direction = req.body?.['direction'] as 'up' | 'down';
      if (direction !== 'up' && direction !== 'down') {
        sendError(res, 'Direction must be "up" or "down"', 400);
        return;
      }
      const current = await model.findById(id);
      if (!current) {
        sendError(res, 'Not found', 404);
        return;
      }
      const scopeQuery = scope(current);
      const neighbor = await model
        .findOne({
          ...scopeQuery,
          order: direction === 'up' ? { $lt: current.order } : { $gt: current.order },
        })
        .sort({ order: direction === 'up' ? -1 : 1 });
      if (!neighbor) {
        sendError(res, `Already at the ${direction === 'up' ? 'top' : 'bottom'}.`, 400);
        return;
      }
      await swapOrders(model, current, neighbor);
      sendSuccess(res, { message: 'Reordered' });
    } catch (err) {
      console.error('moveOne error:', err);
      sendError(res, 'Failed to reorder', 500);
    }
  };
}

export const moveLesson = moveOne(Lesson, (item) => ({ difficulty: item.difficulty }));
export const moveExercise = moveOne(Exercise, (item) => ({ lessonId: item.lessonId }));

// ── Dashboard stats ──────────────────────────────────────────────────────────

export async function getAdminStats(_req: Request, res: Response): Promise<void> {
  try {
    const [totalUsers, totalSessions, totalLessons, totalExercises, totalAchievements, totalTestParagraphs, totalPracticeParagraphs, totalWords, totalSentences, avgWpmAgg] = await Promise.all([
      User.countDocuments(),
      TypingResult.countDocuments(),
      Lesson.countDocuments(),
      Exercise.countDocuments(),
      Achievement.countDocuments(),
      TestParagraph.countDocuments(),
      PracticeParagraph.countDocuments(),
      Word.countDocuments(),
      Sentence.countDocuments(),
      TypingResult.aggregate([{ $group: { _id: null, avgWpm: { $avg: '$wpm' } } }]),
    ]);
    const [admins] = await Promise.all([User.countDocuments({ role: 'admin' })]);
    sendSuccess(res, {
      totalUsers,
      totalSessions,
      totalLessons,
      totalExercises,
      totalAchievements,
      totalTestParagraphs,
      totalPracticeParagraphs,
      totalWords,
      totalSentences,
      totalAdmins: admins,
      avgWpm: Math.round(avgWpmAgg[0]?.avgWpm ?? 0),
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    sendError(res, 'Failed to fetch admin stats', 500);
  }
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const search = String(req.query['search'] ?? '').trim().toLowerCase();
    const role = String(req.query['role'] ?? '').trim();
    const filter: Record<string, unknown> = {};
    if (role === 'user' || role === 'admin') filter.role = role;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).limit(200).lean();
    const stats = await userStatsMap();
    const list = users.map((user) => {
      const s = stats.get(user._id.toString());
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stats: s ?? { sessions: 0, bestWpm: 0, avgAccuracy: 0 },
      };
    });
    sendSuccess(res, { users: list });
  } catch (err) {
    console.error('listUsers error:', err);
    sendError(res, 'Failed to fetch users', 500);
  }
}

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.params['id']).select('-passwordHash').lean();
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    const stats = await singleUserStats(user._id);
    sendSuccess(res, { user: { ...user, stats } });
  } catch (err) {
    console.error('getUser error:', err);
    sendError(res, 'Failed to fetch user', 500);
  }
}

export async function setUserRole(req: Request, res: Response): Promise<void> {
  try {
    const targetId = req.params['id'] as string;
    const { role } = req.body as { role: 'user' | 'admin' };
    if (targetId === adminId(req)?.toString()) {
      sendError(res, 'You cannot change your own role', 400);
      return;
    }
    const target = await User.findById(targetId);
    if (!target) {
      sendError(res, 'User not found', 404);
      return;
    }
    if (role === 'user' && target.role === 'admin') {
      // Never leave the platform without at least one admin.
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        sendError(res, 'Cannot demote the last admin', 400);
        return;
      }
    }
    target.role = role;
    await target.save();
    sendSuccess(res, { user: { _id: target._id, username: target.username, email: target.email, role: target.role } });
  } catch (err) {
    console.error('setUserRole error:', err);
    sendError(res, 'Failed to update user role', 500);
  }
}

// ── Lessons ──────────────────────────────────────────────────────────────────

export async function listLessons(_req: Request, res: Response): Promise<void> {
  try {
    const [lessons, exerciseCounts] = await Promise.all([
      Lesson.find().sort({ order: 1 }).lean(),
      Exercise.aggregate([
        { $group: { _id: '$lessonId', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      ]),
    ]);
    const countMap = new Map(exerciseCounts.map((row) => [String(row._id), row]));
    sendSuccess(res, {
      lessons: lessons.map((lesson) => ({
        ...lesson,
        exerciseCount: countMap.get(lesson._id.toString())?.total ?? 0,
        activeExerciseCount: countMap.get(lesson._id.toString())?.active ?? 0,
      })),
    });
  } catch (err) {
    console.error('listLessons error:', err);
    sendError(res, 'Failed to fetch lessons', 500);
  }
}

export async function createLesson(req: Request, res: Response): Promise<void> {
  try {
    const order = req.body.order ?? (await nextOrder(Lesson, {}));
    const lesson = await Lesson.create({ ...req.body, order, updatedBy: adminId(req) });
    sendSuccess(res, { lesson }, 201);
  } catch (err: any) {
    console.error('createLesson error:', err);
    if (err?.code === 11000) {
      sendError(res, 'A lesson with that order already exists', 409);
      return;
    }
    sendError(res, 'Failed to create lesson', 500);
  }
}

export async function updateLesson(req: Request, res: Response): Promise<void> {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params['id'], { ...req.body, updatedBy: adminId(req) }, { new: true });
    if (!lesson) {
      sendError(res, 'Lesson not found', 404);
      return;
    }
    sendSuccess(res, { lesson });
  } catch (err: any) {
    console.error('updateLesson error:', err);
    if (err?.code === 11000) {
      sendError(res, 'Another lesson already uses that order', 409);
      return;
    }
    sendError(res, 'Failed to update lesson', 500);
  }
}

export async function deleteLesson(req: Request, res: Response): Promise<void> {
  try {
    const lesson = await Lesson.findById(req.params['id']);
    if (!lesson) {
      sendError(res, 'Lesson not found', 404);
      return;
    }
    await Promise.all([
      Exercise.deleteMany({ lessonId: lesson._id }),
      LessonProgress.deleteMany({ lessonId: lesson._id }),
    ]);
    await lesson.deleteOne();
    sendSuccess(res, { message: 'Lesson deleted' });
  } catch (err) {
    console.error('deleteLesson error:', err);
    sendError(res, 'Failed to delete lesson', 500);
  }
}

export async function reorderLessons(req: Request, res: Response): Promise<void> {
  try {
    const orderedIds = (req.body as { orderedIds: string[] }).orderedIds;
    const ok = await applyOrder(Lesson, orderedIds, 'order');
    if (!ok) {
      sendError(res, 'One or more lessons were not found', 400);
      return;
    }
    sendSuccess(res, { message: 'Lessons reordered' });
  } catch (err) {
    console.error('reorderLessons error:', err);
    sendError(res, 'Failed to reorder lessons', 500);
  }
}

// ── Exercises ────────────────────────────────────────────────────────────────

export async function listExercises(req: Request, res: Response): Promise<void> {
  try {
    const exercises = await Exercise.find({ lessonId: req.params['id'] }).sort({ order: 1 }).lean();
    sendSuccess(res, { exercises });
  } catch (err) {
    console.error('listExercises error:', err);
    sendError(res, 'Failed to fetch exercises', 500);
  }
}

export async function createExercise(req: Request, res: Response): Promise<void> {
  try {
    const lessonId = req.params['id'];
    const order = req.body.order ?? (await nextOrder(Exercise, { lessonId }));
    const exercise = await Exercise.create({ ...req.body, lessonId, order, updatedBy: adminId(req) });
    sendSuccess(res, { exercise }, 201);
  } catch (err) {
    console.error('createExercise error:', err);
    sendError(res, 'Failed to create exercise', 500);
  }
}

export async function updateExercise(req: Request, res: Response): Promise<void> {
  try {
    const exercise = await Exercise.findByIdAndUpdate(req.params['id'], { ...req.body, updatedBy: adminId(req) }, { new: true });
    if (!exercise) {
      sendError(res, 'Exercise not found', 404);
      return;
    }
    sendSuccess(res, { exercise });
  } catch (err) {
    console.error('updateExercise error:', err);
    sendError(res, 'Failed to update exercise', 500);
  }
}

export async function deleteExercise(req: Request, res: Response): Promise<void> {
  try {
    const exercise = await Exercise.findById(req.params['id']);
    if (!exercise) {
      sendError(res, 'Exercise not found', 404);
      return;
    }
    // Clean any saved progress that references this exercise.
    await Promise.all([
      LessonProgress.updateMany(
        { completedExerciseIds: exercise._id },
        { $pull: { completedExerciseIds: exercise._id } }
      ),
      LessonProgress.updateMany(
        { 'exercises.exerciseId': exercise._id },
        { $pull: { exercises: { exerciseId: exercise._id } } }
      ),
    ]);
    await exercise.deleteOne();
    sendSuccess(res, { message: 'Exercise deleted' });
  } catch (err) {
    console.error('deleteExercise error:', err);
    sendError(res, 'Failed to delete exercise', 500);
  }
}

export async function reorderExercises(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body as { orderedIds: string[] };
    const ok = await applyOrder(Exercise, orderedIds, 'order');
    if (!ok) {
      sendError(res, 'One or more exercises were not found', 400);
      return;
    }
    sendSuccess(res, { message: 'Exercises reordered' });
  } catch (err) {
    console.error('reorderExercises error:', err);
    sendError(res, 'Failed to reorder exercises', 500);
  }
}

// ── Achievements ─────────────────────────────────────────────────────────────

export async function listAchievements(_req: Request, res: Response): Promise<void> {
  try {
    const achievements = await Achievement.find().sort({ xpReward: 1 }).lean();
    sendSuccess(res, { achievements });
  } catch (err) {
    console.error('listAchievements error:', err);
    sendError(res, 'Failed to fetch achievements', 500);
  }
}

export async function createAchievement(req: Request, res: Response): Promise<void> {
  try {
    const achievement = await Achievement.create({ ...req.body, updatedBy: adminId(req) });
    sendSuccess(res, { achievement }, 201);
  } catch (err: any) {
    console.error('createAchievement error:', err);
    if (err?.code === 11000) {
      sendError(res, 'An achievement with that name already exists', 409);
      return;
    }
    sendError(res, 'Failed to create achievement', 500);
  }
}

export async function updateAchievement(req: Request, res: Response): Promise<void> {
  try {
    const achievement = await Achievement.findByIdAndUpdate(req.params['id'], { ...req.body, updatedBy: adminId(req) }, { new: true });
    if (!achievement) {
      sendError(res, 'Achievement not found', 404);
      return;
    }
    sendSuccess(res, { achievement });
  } catch (err: any) {
    console.error('updateAchievement error:', err);
    if (err?.code === 11000) {
      sendError(res, 'An achievement with that name already exists', 409);
      return;
    }
    sendError(res, 'Failed to update achievement', 500);
  }
}

export async function deleteAchievement(req: Request, res: Response): Promise<void> {
  try {
    const achievement = await Achievement.findById(req.params['id']);
    if (!achievement) {
      sendError(res, 'Achievement not found', 404);
      return;
    }
    await Promise.all([
      UserAchievement.deleteMany({ achievementId: achievement._id }),
      achievement.deleteOne(),
    ]);
    sendSuccess(res, { message: 'Achievement deleted' });
  } catch (err) {
    console.error('deleteAchievement error:', err);
    sendError(res, 'Failed to delete achievement', 500);
  }
}

// ── Content pools (paragraphs, words, sentences) ────────────────────────────

function poolHandlers(
  model: mongoose.Model<any>,
  findOptions: (req: Request) => Record<string, unknown>
) {
  return {
    list: async (req: Request, res: Response): Promise<void> => {
      try {
        const query = findOptions(req);
        const items = await model.find(query).sort({ createdAt: -1 }).limit(500).lean();
        sendSuccess(res, { items });
      } catch (err) {
        console.error('listPool error:', err);
        sendError(res, 'Failed to fetch content', 500);
      }
    },
    create: async (req: Request, res: Response): Promise<void> => {
      try {
        const item = await model.create({ ...req.body, updatedBy: adminId(req) });
        sendSuccess(res, { item }, 201);
      } catch (err: any) {
        console.error('createPool error:', err);
        if (err?.code === 11000) {
          sendError(res, 'Content value already exists', 409);
          return;
        }
        sendError(res, 'Failed to create content', 500);
      }
    },
    update: async (req: Request, res: Response): Promise<void> => {
      try {
        const item = await model.findByIdAndUpdate(req.params['id'], { ...req.body, updatedBy: adminId(req) }, { new: true });
        if (!item) {
          sendError(res, 'Content not found', 404);
          return;
        }
        sendSuccess(res, { item });
      } catch (err: any) {
        console.error('updatePool error:', err);
        if (err?.code === 11000) {
          sendError(res, 'Content value already exists', 409);
          return;
        }
        sendError(res, 'Failed to update content', 500);
      }
    },
    remove: async (req: Request, res: Response): Promise<void> => {
      try {
        const item = await model.findByIdAndDelete(req.params['id']);
        if (!item) {
          sendError(res, 'Content not found', 404);
          return;
        }
        sendSuccess(res, { message: 'Deleted' });
      } catch (err) {
        console.error('deletePool error:', err);
        sendError(res, 'Failed to delete content', 500);
      }
    },
  };
}

const testParagraph = poolHandlers(TestParagraph, (req) => {
  const q: Record<string, unknown> = {};
  const difficulty = String(req.query['difficulty'] ?? '');
  if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) q.difficulty = difficulty;
  return q;
});
const practiceParagraph = poolHandlers(PracticeParagraph, (req) => {
  const q: Record<string, unknown> = {};
  const difficulty = String(req.query['difficulty'] ?? '');
  if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) q.difficulty = difficulty;
  return q;
});
const wordPool = poolHandlers(Word, (req) => {
  const q: Record<string, unknown> = {};
  const difficulty = String(req.query['difficulty'] ?? '');
  if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) q.difficulty = difficulty;
  return q;
});
const sentencePool = poolHandlers(Sentence, (req) => {
  const q: Record<string, unknown> = {};
  const difficulty = String(req.query['difficulty'] ?? '');
  if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) q.difficulty = difficulty;
  return q;
});

export const adminTestParagraphs = testParagraph;
export const adminPracticeParagraphs = practiceParagraph;
export const adminWords = wordPool;
export const adminSentences = sentencePool;

// ── Platform settings (leaderboard, games config) ───────────────────────────

export async function getSettings(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await PlatformSetting.find().lean();
    const settings: Record<string, unknown> = {};
    for (const row of rows) settings[row.key] = row.value;
    sendSuccess(res, {
      settings,
      defaults: {
        'leaderboard.minAccuracy': 90,
        'leaderboard.topLimit': 50,
        'certificate.durationSeconds': 60,
      },
    });
  } catch (err) {
    console.error('getSettings error:', err);
    sendError(res, 'Failed to fetch platform settings', 500);
  }
}

const WRITABLE_KEYS: Record<string, (value: unknown) => boolean> = {
  'leaderboard.minAccuracy': (v) => typeof v === 'number' && v >= 60 && v <= 100,
  'leaderboard.topLimit': (v) => typeof v === 'number' && v >= 10 && v <= 200,
  'games.wordRush.chunkWords': (v) => typeof v === 'number' && v >= 20 && v <= 400,
  'certificate.durationSeconds': (v) => typeof v === 'number' && v >= 30 && v <= 900,
};

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const incoming = (req.body as { settings: Record<string, unknown> }).settings ?? {};
    const keys = Object.keys(incoming);
    if (!keys.length) {
      sendError(res, 'No settings provided', 400);
      return;
    }
    for (const key of keys) {
      const validateValue = WRITABLE_KEYS[key];
      if (!validateValue) {
        sendError(res, `Setting "${key}" is not configurable`, 400);
        return;
      }
      if (!validateValue(incoming[key])) {
        sendError(res, `Invalid value for "${key}"`, 400);
        return;
      }
    }
    for (const key of keys) {
      await PlatformSetting.updateOne(
        { key },
        { $set: { value: incoming[key], updatedBy: adminId(req) } },
        { upsert: true }
      );
    }
    const rows = await PlatformSetting.find().lean();
    const settings: Record<string, unknown> = {};
    for (const row of rows) settings[row.key] = row.value;
    sendSuccess(res, { settings });
  } catch (err) {
    console.error('updateSettings error:', err);
    sendError(res, 'Failed to update platform settings', 500);
  }
}