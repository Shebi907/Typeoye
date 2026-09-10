"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const admin_controller_1 = require("../controllers/admin.controller");
const certificateParagraph_controller_1 = require("../controllers/certificateParagraph.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, auth_middleware_1.requireAdmin);
// ── Validation schemas ───────────────────────────────────────────────────────
const DIFFICULTY = ['beginner', 'intermediate', 'advanced'];
const lessonSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Title must be at least 3 characters').max(80),
    description: zod_1.z.string().trim().min(5, 'Description must be at least 5 characters').max(500),
    category: zod_1.z.string().trim().min(2).max(50),
    difficulty: zod_1.z.number().int().min(1).max(9),
    order: zod_1.z.number().int().min(1).optional(),
    isActive: zod_1.z.boolean().optional(),
    accuracyThreshold: zod_1.z.number().int().min(1).max(100).optional(),
    targetKeys: zod_1.z.array(zod_1.z.string().min(1).max(10)).max(20).optional(),
});
const exerciseSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1).max(120),
    type: zod_1.z.enum(['keys', 'words', 'sentences', 'paragraph', 'custom']),
    language: zod_1.z.enum(['en']).optional(),
    level: zod_1.z.number().int().min(1).max(9),
    content: zod_1.z.string().trim().min(1),
    targetKeys: zod_1.z.array(zod_1.z.string().min(1).max(10)).max(20).optional(),
    difficulty: zod_1.z.number().int().min(1).max(9),
    order: zod_1.z.number().int().min(1).optional(),
    isActive: zod_1.z.boolean().optional(),
});
const achievementSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(80),
    description: zod_1.z.string().trim().min(5).max(300),
    icon: zod_1.z.string().trim().min(1).max(60),
    condition: zod_1.z.object({
        type: zod_1.z.string().trim().min(1).max(40),
        threshold: zod_1.z.number().int().min(1).max(100000),
    }),
    params: zod_1.z
        .object({
        minAccuracy: zod_1.z.number().min(0).max(100).optional(),
        minWpm: zod_1.z.number().min(0).max(999).optional(),
        minDuration: zod_1.z.number().int().min(1).max(86400).optional(),
        requiredTests: zod_1.z.number().int().min(1).max(100000).optional(),
    })
        .optional(),
    xpReward: zod_1.z.number().int().min(1).max(100000),
    rarity: zod_1.z.enum(['common', 'rare', 'epic', 'legendary']),
    isActive: zod_1.z.boolean().optional(),
});
const paragraphSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(10).max(5000),
    difficulty: zod_1.z.enum(DIFFICULTY),
    topic: zod_1.z.string().trim().min(1).max(60),
});
const wordSchema = zod_1.z.object({
    text: zod_1.z.string().trim().min(1).max(50),
    difficulty: zod_1.z.enum(DIFFICULTY),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1).max(30)).max(10).optional(),
});
const sentenceSchema = zod_1.z.object({
    text: zod_1.z.string().trim().min(5).max(500),
    difficulty: zod_1.z.enum(DIFFICULTY),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1).max(30)).max(10).optional(),
});
const certificateParagraphSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(10).max(5000),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
    isActive: zod_1.z.boolean().optional(),
});
const roleSchema = zod_1.z.object({ role: zod_1.z.enum(['user', 'admin']) });
const reorderSchema = zod_1.z.object({ orderedIds: zod_1.z.array(zod_1.z.string().min(1)).min(1) });
const settingsSchema = zod_1.z.object({
    settings: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
});
// ── Admin routes ─────────────────────────────────────────────────────────────
router.get('/stats', admin_controller_1.getAdminStats);
// Users
router.get('/users', admin_controller_1.listUsers);
router.get('/users/:id', admin_controller_1.getUser);
router.patch('/users/:id/role', (0, validate_middleware_1.validate)(roleSchema), admin_controller_1.setUserRole);
// Lessons
router.get('/lessons', admin_controller_1.listLessons);
router.post('/lessons', (0, validate_middleware_1.validate)(lessonSchema), admin_controller_1.createLesson);
router.patch('/lessons/:id', (0, validate_middleware_1.validate)(lessonSchema.partial()), admin_controller_1.updateLesson);
router.delete('/lessons/:id', admin_controller_1.deleteLesson);
router.post('/lessons/reorder', (0, validate_middleware_1.validate)(reorderSchema), admin_controller_1.reorderLessons);
router.patch('/lessons/:id/move', admin_controller_1.moveLesson);
// Exercises
router.get('/lessons/:id/exercises', admin_controller_1.listExercises);
router.post('/lessons/:id/exercises', (0, validate_middleware_1.validate)(exerciseSchema), admin_controller_1.createExercise);
router.patch('/exercises/:id', (0, validate_middleware_1.validate)(exerciseSchema.partial()), admin_controller_1.updateExercise);
router.delete('/exercises/:id', admin_controller_1.deleteExercise);
router.post('/exercises/reorder', (0, validate_middleware_1.validate)(reorderSchema), admin_controller_1.reorderExercises);
router.patch('/exercises/:id/move', admin_controller_1.moveExercise);
// Achievements
router.get('/achievements', admin_controller_1.listAchievements);
router.post('/achievements', (0, validate_middleware_1.validate)(achievementSchema), admin_controller_1.createAchievement);
router.patch('/achievements/:id', (0, validate_middleware_1.validate)(achievementSchema.partial()), admin_controller_1.updateAchievement);
router.delete('/achievements/:id', admin_controller_1.deleteAchievement);
// Content pools
router.get('/test-paragraphs', admin_controller_1.adminTestParagraphs.list);
router.post('/test-paragraphs', (0, validate_middleware_1.validate)(paragraphSchema), admin_controller_1.adminTestParagraphs.create);
router.patch('/test-paragraphs/:id', (0, validate_middleware_1.validate)(paragraphSchema.partial()), admin_controller_1.adminTestParagraphs.update);
router.delete('/test-paragraphs/:id', admin_controller_1.adminTestParagraphs.remove);
router.get('/practice-paragraphs', admin_controller_1.adminPracticeParagraphs.list);
router.post('/practice-paragraphs', (0, validate_middleware_1.validate)(paragraphSchema), admin_controller_1.adminPracticeParagraphs.create);
router.patch('/practice-paragraphs/:id', (0, validate_middleware_1.validate)(paragraphSchema.partial()), admin_controller_1.adminPracticeParagraphs.update);
router.delete('/practice-paragraphs/:id', admin_controller_1.adminPracticeParagraphs.remove);
router.get('/words', admin_controller_1.adminWords.list);
router.post('/words', (0, validate_middleware_1.validate)(wordSchema), admin_controller_1.adminWords.create);
router.patch('/words/:id', (0, validate_middleware_1.validate)(wordSchema.partial()), admin_controller_1.adminWords.update);
router.delete('/words/:id', admin_controller_1.adminWords.remove);
router.get('/sentences', admin_controller_1.adminSentences.list);
router.post('/sentences', (0, validate_middleware_1.validate)(sentenceSchema), admin_controller_1.adminSentences.create);
router.patch('/sentences/:id', (0, validate_middleware_1.validate)(sentenceSchema.partial()), admin_controller_1.adminSentences.update);
router.delete('/sentences/:id', admin_controller_1.adminSentences.remove);
// Certificate paragraph library (Certificate Test mode)
router.get('/certificate-paragraphs', certificateParagraph_controller_1.adminCertificateParagraphs.list);
router.post('/certificate-paragraphs', (0, validate_middleware_1.validate)(certificateParagraphSchema), certificateParagraph_controller_1.adminCertificateParagraphs.create);
router.patch('/certificate-paragraphs/:id', (0, validate_middleware_1.validate)(certificateParagraphSchema.partial()), certificateParagraph_controller_1.adminCertificateParagraphs.update);
router.delete('/certificate-paragraphs/:id', certificateParagraph_controller_1.adminCertificateParagraphs.remove);
// ── Platform Settings ──────────────────────────────────────────────────────────
router.get('/settings', admin_controller_1.getSettings);
router.patch('/settings', (0, validate_middleware_1.validate)(settingsSchema), admin_controller_1.updateSettings);
// ── Email Testing ──────────────────────────────────────────────────────────────
router.post('/email/test', admin_controller_1.testEmail);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map