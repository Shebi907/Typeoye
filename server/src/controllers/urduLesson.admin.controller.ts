import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Lesson from '../models/Lesson';
import Exercise from '../models/Exercise';
import LessonProgress from '../models/LessonProgress';
import { sendSuccess, sendError } from '../utils/response';
import { seedUrduLessons as runUrduSeed, URDU_CURRICULUM } from '../seed/urduLessons';

/**
 * Admin management for the Urdu Learn course. These handlers are deliberately
 * separate from the English lesson handlers so the two courses are managed
 * (and listed) independently. Every query is hard-scoped to language 'ur'.
 */

const adminId = (req: Request) => req.user?._id as mongoose.Types.ObjectId | undefined;
const URDU = 'ur' as const;

/** Reassign a contiguous 1-based `order` within a model, collision-free. */
async function applyOrder(model: mongoose.Model<any>, orderedIds: string[], scope: Record<string, unknown>): Promise<boolean> {
  const found = await model.countDocuments({ _id: { $in: orderedIds }, ...scope });
  if (found !== orderedIds.length) return false;
  for (let i = 0; i < orderedIds.length; i++) {
    await model.updateOne({ _id: orderedIds[i] }, { $set: { order: -(i + 1000) } });
  }
  await Promise.all(orderedIds.map((id, i) => model.updateOne({ _id: id }, { $set: { order: i + 1 } })));
  return true;
}

async function nextOrder(model: mongoose.Model<any>, query: Record<string, unknown>): Promise<number> {
  const last = await model.findOne(query).sort({ order: -1 });
  return (last?.order ?? 0) + 1;
}

export async function listUrduLessons(_req: Request, res: Response): Promise<void> {
  try {
    const lessons = await Lesson.find({ language: URDU }).sort({ order: 1 }).lean();
    const counts = await Exercise.aggregate([
      { $match: { lessonId: { $in: lessons.map((l) => l._id) } } },
      { $group: { _id: '$lessonId', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
    ]);
    const countMap = new Map(counts.map((row) => [String(row._id), row]));
    sendSuccess(res, {
      lessons: lessons.map((lesson) => ({
        ...lesson,
        exerciseCount: countMap.get(lesson._id.toString())?.total ?? 0,
        activeExerciseCount: countMap.get(lesson._id.toString())?.active ?? 0,
      })),
    });
  } catch (err) {
    console.error('listUrduLessons error:', err);
    sendError(res, 'Failed to fetch Urdu lessons', 500);
  }
}

export async function createUrduLesson(req: Request, res: Response): Promise<void> {
  try {
    const order = req.body.order ?? (await nextOrder(Lesson, { language: URDU }));
    const lesson = await Lesson.create({ ...req.body, language: URDU, order, updatedBy: adminId(req) });
    sendSuccess(res, { lesson }, 201);
  } catch (err: any) {
    console.error('createUrduLesson error:', err);
    if (err?.code === 11000) {
      sendError(res, 'An Urdu level with that order already exists', 409);
      return;
    }
    sendError(res, 'Failed to create Urdu lesson', 500);
  }
}

export async function updateUrduLesson(req: Request, res: Response): Promise<void> {
  try {
    const existing = await Lesson.findOne({ _id: req.params['id'], language: URDU });
    if (!existing) {
      sendError(res, 'Urdu lesson not found', 404);
      return;
    }
    const { language: _ignored, ...body } = req.body as Record<string, unknown>;
    const lesson = await Lesson.findByIdAndUpdate(req.params['id'], { ...body, updatedBy: adminId(req) }, { new: true });
    sendSuccess(res, { lesson });
  } catch (err: any) {
    console.error('updateUrduLesson error:', err);
    if (err?.code === 11000) {
      sendError(res, 'Another Urdu level already uses that order', 409);
      return;
    }
    sendError(res, 'Failed to update Urdu lesson', 500);
  }
}

export async function deleteUrduLesson(req: Request, res: Response): Promise<void> {
  try {
    const lesson = await Lesson.findOne({ _id: req.params['id'], language: URDU });
    if (!lesson) {
      sendError(res, 'Urdu lesson not found', 404);
      return;
    }
    await Promise.all([
      Exercise.deleteMany({ lessonId: lesson._id }),
      LessonProgress.deleteMany({ lessonId: lesson._id }),
    ]);
    await lesson.deleteOne();
    sendSuccess(res, { message: 'Urdu lesson deleted' });
  } catch (err) {
    console.error('deleteUrduLesson error:', err);
    sendError(res, 'Failed to delete Urdu lesson', 500);
  }
}

export async function reorderUrduLessons(req: Request, res: Response): Promise<void> {
  try {
    const orderedIds = (req.body as { orderedIds: string[] }).orderedIds;
    const ok = await applyOrder(Lesson, orderedIds, { language: URDU });
    if (!ok) {
      sendError(res, 'One or more Urdu levels were not found', 400);
      return;
    }
    sendSuccess(res, { message: 'Urdu lessons reordered' });
  } catch (err) {
    console.error('reorderUrduLessons error:', err);
    sendError(res, 'Failed to reorder Urdu lessons', 500);
  }
}

export async function moveUrduLesson(req: Request, res: Response): Promise<void> {
  try {
    const direction = req.body?.['direction'] as 'up' | 'down';
    if (direction !== 'up' && direction !== 'down') {
      sendError(res, 'Direction must be "up" or "down"', 400);
      return;
    }
    const current = await Lesson.findOne({ _id: req.params['id'], language: URDU });
    if (!current) {
      sendError(res, 'Urdu lesson not found', 404);
      return;
    }
    const neighbor = await Lesson.findOne({
      language: URDU,
      order: direction === 'up' ? { $lt: current.order } : { $gt: current.order },
    }).sort({ order: direction === 'up' ? -1 : 1 });
    if (!neighbor) {
      sendError(res, `Already at the ${direction === 'up' ? 'top' : 'bottom'}.`, 400);
      return;
    }
    const oldSelf = current.order;
    const oldNeighbor = neighbor.order;
    await Lesson.updateOne({ _id: current._id }, { $set: { order: -1 } });
    await Lesson.updateOne({ _id: neighbor._id }, { $set: { order: oldSelf } });
    await Lesson.updateOne({ _id: current._id }, { $set: { order: oldNeighbor } });
    sendSuccess(res, { message: 'Reordered' });
  } catch (err) {
    console.error('moveUrduLesson error:', err);
    sendError(res, 'Failed to reorder', 500);
  }
}

/** Idempotently (re)seed the 16 Urdu levels from the canonical curriculum. */
export async function seedUrduLessonsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const result = await runUrduSeed();
    sendSuccess(res, { ...result, curriculum: URDU_CURRICULUM.length, message: 'Urdu lessons seeded' });
  } catch (err) {
    console.error('seedUrduLessonsHandler error:', err);
    sendError(res, 'Failed to seed Urdu lessons', 500);
  }
}
