import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import {
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  moveLesson,
  listLessons,
  createExercise,
  updateExercise,
  deleteExercise,
  reorderExercises,
  moveExercise,
  listExercises,
  getAdminStats,
  listUsers,
  getUser,
  setUserRole,
  listAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  adminTestParagraphs,
  adminPracticeParagraphs,
  adminWords,
  adminSentences,
  getSettings,
  updateSettings,
  testEmail,
} from '../controllers/admin.controller';
import { adminCertificateParagraphs } from '../controllers/certificateParagraph.controller';
import {
  adminUrduTestParagraphs,
  adminUrduPracticeItems,
} from '../controllers/urduContent.controller';
import {
  listUrduLessons,
  createUrduLesson,
  updateUrduLesson,
  deleteUrduLesson,
  reorderUrduLessons,
  moveUrduLesson,
  seedUrduLessonsHandler,
} from '../controllers/urduLesson.admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';


const router = Router();

router.use(authenticate, requireAdmin);

// ── Validation schemas ───────────────────────────────────────────────────────
const DIFFICULTY = ['beginner', 'intermediate', 'advanced'] as const;

/** Urdu/Arabic script range — every managed Urdu string must contain RTL text. */
const URDU_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const urduText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => URDU_SCRIPT.test(value), 'Must contain Urdu (RTL) text');

const urduTestParagraphSchema = z.object({
  content: urduText(5, 5000),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  duration: z.union([z.literal(1), z.literal(2), z.literal(5)]),
  isActive: z.boolean().optional(),
});

const urduPracticeItemSchema = z.object({
  category: z.enum(['characters', 'combinations', 'words', 'sentences', 'paragraphs']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  text: urduText(1, 2000),
  isActive: z.boolean().optional(),
});

const moveSchema = z.object({ direction: z.enum(['up', 'down']) });

const lessonSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(80),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(500),
  category: z.string().trim().min(2).max(50),
  difficulty: z.number().int().min(1).max(9),
  order: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  accuracyThreshold: z.number().int().min(1).max(100).optional(),
  targetKeys: z.array(z.string().min(1).max(10)).max(20).optional(),
});

const exerciseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(['keys', 'words', 'sentences', 'paragraph', 'custom']),
  language: z.enum(['en', 'ur']).optional(),
  level: z.number().int().min(1).max(9),
  content: z.string().trim().min(1),
  targetKeys: z.array(z.string().min(1).max(10)).max(20).optional(),
  difficulty: z.number().int().min(1).max(9),
  order: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

/** Urdu level: title must be Urdu (RTL) script; description may be English. */
const urduLessonSchema = z.object({
  title: urduText(2, 80),
  description: z.string().trim().min(5).max(500),
  category: z.enum(['foundation', 'building-blocks', 'flow-rhythm', 'advanced']),
  difficulty: z.number().int().min(1).max(9),
  order: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  accuracyThreshold: z.number().int().min(1).max(100).optional(),
  targetKeys: z.array(z.string().min(1).max(10)).max(30).optional(),
});

/** Force `language: 'ur'` on every Urdu exercise write, regardless of body. */
const forceUrduExercise = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') (req.body as Record<string, unknown>).language = 'ur';
  next();
};

const achievementSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(5).max(300),
  icon: z.string().trim().min(1).max(60),
  condition: z.object({
    type: z.string().trim().min(1).max(40),
    threshold: z.number().int().min(1).max(100000),
  }),
  params: z
    .object({
      minAccuracy: z.number().min(0).max(100).optional(),
      minWpm: z.number().min(0).max(999).optional(),
      minDuration: z.number().int().min(1).max(86400).optional(),
      requiredTests: z.number().int().min(1).max(100000).optional(),
    })
    .optional(),
  xpReward: z.number().int().min(1).max(100000),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
  language: z.enum(['en', 'ur']).optional(),
  isActive: z.boolean().optional(),
});

const paragraphSchema = z.object({
  content: z.string().trim().min(10).max(5000),
  difficulty: z.enum(DIFFICULTY),
  topic: z.string().trim().min(1).max(60),
});

const wordSchema = z.object({
  text: z.string().trim().min(1).max(50),
  difficulty: z.enum(DIFFICULTY),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

const sentenceSchema = z.object({
  text: z.string().trim().min(5).max(500),
  difficulty: z.enum(DIFFICULTY),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

const certificateParagraphSchema = z.object({
  content: z.string().trim().min(10).max(5000),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  isActive: z.boolean().optional(),
});

const roleSchema = z.object({ role: z.enum(['user', 'admin']) });
const reorderSchema = z.object({ orderedIds: z.array(z.string().min(1)).min(1) });
const settingsSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
});

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get('/stats', getAdminStats);

// Users
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/role', validate(roleSchema), setUserRole);

// Lessons
router.get('/lessons', listLessons);
router.post('/lessons', validate(lessonSchema), createLesson);
router.patch('/lessons/:id', validate(lessonSchema.partial()), updateLesson);
router.delete('/lessons/:id', deleteLesson);
router.post('/lessons/reorder', validate(reorderSchema), reorderLessons);
router.patch('/lessons/:id/move', moveLesson);

// Exercises
router.get('/lessons/:id/exercises', listExercises);
router.post('/lessons/:id/exercises', validate(exerciseSchema), createExercise);
router.patch('/exercises/:id', validate(exerciseSchema.partial()), updateExercise);
router.delete('/exercises/:id', deleteExercise);
router.post('/exercises/reorder', validate(reorderSchema), reorderExercises);
router.patch('/exercises/:id/move', moveExercise);

// Urdu Lessons (independent course, language pinned to 'ur')
router.get('/urdu-lessons', listUrduLessons);
router.post('/urdu-lessons', validate(urduLessonSchema), createUrduLesson);
router.post('/urdu-lessons/seed', seedUrduLessonsHandler);
router.post('/urdu-lessons/reorder', validate(reorderSchema), reorderUrduLessons);
router.patch('/urdu-lessons/:id', validate(urduLessonSchema.partial()), updateUrduLesson);
router.delete('/urdu-lessons/:id', deleteUrduLesson);
router.patch('/urdu-lessons/:id/move', moveUrduLesson);

// Urdu Exercises (reuse the generic, lesson-scoped exercise handlers)
router.get('/urdu-lessons/:id/exercises', listExercises);
router.post('/urdu-lessons/:id/exercises', forceUrduExercise, validate(exerciseSchema), createExercise);
router.patch('/urdu-exercises/:id', forceUrduExercise, validate(exerciseSchema.partial()), updateExercise);
router.delete('/urdu-exercises/:id', deleteExercise);
router.post('/urdu-exercises/reorder', validate(reorderSchema), reorderExercises);
router.patch('/urdu-exercises/:id/move', moveExercise);

// Achievements
router.get('/achievements', listAchievements);
router.post('/achievements', validate(achievementSchema), createAchievement);
router.patch('/achievements/:id', validate(achievementSchema.partial()), updateAchievement);
router.delete('/achievements/:id', deleteAchievement);

// Content pools
router.get('/test-paragraphs', adminTestParagraphs.list);
router.post('/test-paragraphs', validate(paragraphSchema), adminTestParagraphs.create);
router.patch('/test-paragraphs/:id', validate(paragraphSchema.partial()), adminTestParagraphs.update);
router.delete('/test-paragraphs/:id', adminTestParagraphs.remove);

router.get('/practice-paragraphs', adminPracticeParagraphs.list);
router.post('/practice-paragraphs', validate(paragraphSchema), adminPracticeParagraphs.create);
router.patch('/practice-paragraphs/:id', validate(paragraphSchema.partial()), adminPracticeParagraphs.update);
router.delete('/practice-paragraphs/:id', adminPracticeParagraphs.remove);

router.get('/words', adminWords.list);
router.post('/words', validate(wordSchema), adminWords.create);
router.patch('/words/:id', validate(wordSchema.partial()), adminWords.update);
router.delete('/words/:id', adminWords.remove);

router.get('/sentences', adminSentences.list);
router.post('/sentences', validate(sentenceSchema), adminSentences.create);
router.patch('/sentences/:id', validate(sentenceSchema.partial()), adminSentences.update);
router.delete('/sentences/:id', adminSentences.remove);

// Certificate paragraph library (Certificate Test mode)
router.get('/certificate-paragraphs', adminCertificateParagraphs.list);
router.post('/certificate-paragraphs', validate(certificateParagraphSchema), adminCertificateParagraphs.create);
router.patch('/certificate-paragraphs/:id', validate(certificateParagraphSchema.partial()), adminCertificateParagraphs.update);
router.delete('/certificate-paragraphs/:id', adminCertificateParagraphs.remove);

// Urdu Typing Test passages (difficulty + duration, draft/publish)
router.get('/urdu-test-paragraphs', adminUrduTestParagraphs.list);
router.post('/urdu-test-paragraphs', validate(urduTestParagraphSchema), adminUrduTestParagraphs.create);
router.patch('/urdu-test-paragraphs/:id', validate(urduTestParagraphSchema.partial()), adminUrduTestParagraphs.update);
router.delete('/urdu-test-paragraphs/:id', adminUrduTestParagraphs.remove);

// Urdu Practice content (category + difficulty, per-scope ordering, draft/publish)
router.get('/urdu-practice-items', adminUrduPracticeItems.list);
router.post('/urdu-practice-items', validate(urduPracticeItemSchema), adminUrduPracticeItems.create);
router.patch('/urdu-practice-items/:id', validate(urduPracticeItemSchema.partial()), adminUrduPracticeItems.update);
router.delete('/urdu-practice-items/:id', adminUrduPracticeItems.remove);
router.patch('/urdu-practice-items/:id/move', validate(moveSchema), adminUrduPracticeItems.move);

// ── Platform Settings ──────────────────────────────────────────────────────────
router.get('/settings', getSettings);
router.patch('/settings', validate(settingsSchema), updateSettings);

// ── Email Testing ──────────────────────────────────────────────────────────────
router.post('/email/test', testEmail);

export default router;