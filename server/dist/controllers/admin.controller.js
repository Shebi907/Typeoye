"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSentences = exports.adminWords = exports.adminPracticeParagraphs = exports.adminTestParagraphs = exports.moveExercise = exports.moveLesson = exports.testEmail = void 0;
exports.getAdminStats = getAdminStats;
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.setUserRole = setUserRole;
exports.listLessons = listLessons;
exports.createLesson = createLesson;
exports.updateLesson = updateLesson;
exports.deleteLesson = deleteLesson;
exports.reorderLessons = reorderLessons;
exports.listExercises = listExercises;
exports.createExercise = createExercise;
exports.updateExercise = updateExercise;
exports.deleteExercise = deleteExercise;
exports.reorderExercises = reorderExercises;
exports.listAchievements = listAchievements;
exports.createAchievement = createAchievement;
exports.updateAchievement = updateAchievement;
exports.deleteAchievement = deleteAchievement;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const Lesson_1 = __importDefault(require("../models/Lesson"));
const Exercise_1 = __importDefault(require("../models/Exercise"));
const Achievement_1 = __importDefault(require("../models/Achievement"));
const User_1 = __importDefault(require("../models/User"));
const TypingResult_1 = __importDefault(require("../models/TypingResult"));
const TestParagraph_1 = __importDefault(require("../models/TestParagraph"));
const PracticeParagraph_1 = __importDefault(require("../models/PracticeParagraph"));
const Word_1 = __importDefault(require("../models/Word"));
const Sentence_1 = __importDefault(require("../models/Sentence"));
const PlatformSetting_1 = __importDefault(require("../models/PlatformSetting"));
const LessonProgress_1 = __importDefault(require("../models/LessonProgress"));
const UserAchievement_1 = __importDefault(require("../models/UserAchievement"));
const response_1 = require("../utils/response");
const emailService_1 = require("../services/emailService");
const testEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return (0, response_1.sendError)(res, 'Recipient email is required.', 400);
    }
    try {
        await (0, emailService_1.sendEmail)({
            to: email,
            subject: 'Typeoye Test Email',
            html: '<p>Hello! This is a test email from Typeoye.</p><p>Resend email integration is working successfully.</p>',
        });
        (0, response_1.sendSuccess)(res, { message: 'Test email sent successfully' }, 200);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to send test email', 500);
    }
};
exports.testEmail = testEmail;
const adminId = (req) => req.user?._id;
// ── Shared helpers ───────────────────────────────────────────────────────────
/** Per-user typing stats summary (sessions, best WPM, avg accuracy). */
async function userStatsMap() {
    const rows = await TypingResult_1.default.aggregate([
        { $group: { _id: '$userId', sessions: { $sum: 1 }, bestWpm: { $max: '$wpm' }, avgAccuracy: { $avg: '$accuracy' } } },
    ]);
    const map = new Map();
    for (const row of rows) {
        map.set(String(row._id), {
            sessions: row.sessions,
            bestWpm: Math.round(row.bestWpm),
            avgAccuracy: Math.round(row.avgAccuracy * 10) / 10,
        });
    }
    return map;
}
async function singleUserStats(userId) {
    const rows = await TypingResult_1.default.aggregate([
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
async function applyOrder(model, orderedIds, field) {
    const found = await model.countDocuments({ _id: { $in: orderedIds } });
    if (found !== orderedIds.length)
        return false;
    for (let i = 0; i < orderedIds.length; i++) {
        await model.updateOne({ _id: orderedIds[i] }, { $set: { [field]: -(i + 1000) } });
    }
    await Promise.all(orderedIds.map((id, i) => model.updateOne({ _id: id }, { $set: { [field]: i + 1 } })));
    return true;
}
async function nextOrder(model, query) {
    const last = await model.findOne(query).sort({ order: -1 });
    return (last?.order ?? 0) + 1;
}
/** Swap the order values of two documents without tripping a unique index. */
async function swapOrders(model, current, neighbor) {
    const oldSelf = current.order;
    const oldNeighbor = neighbor.order;
    await model.updateOne({ _id: current._id }, { $set: { order: -1 } });
    await model.updateOne({ _id: neighbor._id }, { $set: { order: oldSelf } });
    await model.updateOne({ _id: current._id }, { $set: { order: oldNeighbor } });
}
function moveOne(model, scope) {
    return async (req, res) => {
        try {
            const id = req.params['id'];
            const direction = req.body?.['direction'];
            if (direction !== 'up' && direction !== 'down') {
                (0, response_1.sendError)(res, 'Direction must be "up" or "down"', 400);
                return;
            }
            const current = await model.findById(id);
            if (!current) {
                (0, response_1.sendError)(res, 'Not found', 404);
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
                (0, response_1.sendError)(res, `Already at the ${direction === 'up' ? 'top' : 'bottom'}.`, 400);
                return;
            }
            await swapOrders(model, current, neighbor);
            (0, response_1.sendSuccess)(res, { message: 'Reordered' });
        }
        catch (err) {
            console.error('moveOne error:', err);
            (0, response_1.sendError)(res, 'Failed to reorder', 500);
        }
    };
}
exports.moveLesson = moveOne(Lesson_1.default, (item) => ({ difficulty: item.difficulty }));
exports.moveExercise = moveOne(Exercise_1.default, (item) => ({ lessonId: item.lessonId }));
// ── Dashboard stats ──────────────────────────────────────────────────────────
async function getAdminStats(_req, res) {
    try {
        const [totalUsers, totalSessions, totalLessons, totalExercises, totalAchievements, totalTestParagraphs, totalPracticeParagraphs, totalWords, totalSentences, avgWpmAgg] = await Promise.all([
            User_1.default.countDocuments(),
            TypingResult_1.default.countDocuments(),
            Lesson_1.default.countDocuments(),
            Exercise_1.default.countDocuments(),
            Achievement_1.default.countDocuments(),
            TestParagraph_1.default.countDocuments(),
            PracticeParagraph_1.default.countDocuments(),
            Word_1.default.countDocuments(),
            Sentence_1.default.countDocuments(),
            TypingResult_1.default.aggregate([{ $group: { _id: null, avgWpm: { $avg: '$wpm' } } }]),
        ]);
        const [admins] = await Promise.all([User_1.default.countDocuments({ role: 'admin' })]);
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (err) {
        console.error('getAdminStats error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch admin stats', 500);
    }
}
// ── Users ────────────────────────────────────────────────────────────────────
async function listUsers(req, res) {
    try {
        const search = String(req.query['search'] ?? '').trim().toLowerCase();
        const role = String(req.query['role'] ?? '').trim();
        const filter = {};
        if (role === 'user' || role === 'admin')
            filter.role = role;
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const users = await User_1.default.find(filter).select('-passwordHash').sort({ createdAt: -1 }).limit(200).lean();
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
        (0, response_1.sendSuccess)(res, { users: list });
    }
    catch (err) {
        console.error('listUsers error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch users', 500);
    }
}
async function getUser(req, res) {
    try {
        const user = await User_1.default.findById(req.params['id']).select('-passwordHash').lean();
        if (!user) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        const stats = await singleUserStats(user._id);
        (0, response_1.sendSuccess)(res, { user: { ...user, stats } });
    }
    catch (err) {
        console.error('getUser error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch user', 500);
    }
}
async function setUserRole(req, res) {
    try {
        const targetId = req.params['id'];
        const { role } = req.body;
        if (targetId === adminId(req)?.toString()) {
            (0, response_1.sendError)(res, 'You cannot change your own role', 400);
            return;
        }
        const target = await User_1.default.findById(targetId);
        if (!target) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        if (role === 'user' && target.role === 'admin') {
            // Never leave the platform without at least one admin.
            const adminCount = await User_1.default.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                (0, response_1.sendError)(res, 'Cannot demote the last admin', 400);
                return;
            }
        }
        target.role = role;
        await target.save();
        (0, response_1.sendSuccess)(res, { user: { _id: target._id, username: target.username, email: target.email, role: target.role } });
    }
    catch (err) {
        console.error('setUserRole error:', err);
        (0, response_1.sendError)(res, 'Failed to update user role', 500);
    }
}
// ── Lessons ──────────────────────────────────────────────────────────────────
async function listLessons(_req, res) {
    try {
        const [lessons, exerciseCounts] = await Promise.all([
            Lesson_1.default.find().sort({ order: 1 }).lean(),
            Exercise_1.default.aggregate([
                { $group: { _id: '$lessonId', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
            ]),
        ]);
        const countMap = new Map(exerciseCounts.map((row) => [String(row._id), row]));
        (0, response_1.sendSuccess)(res, {
            lessons: lessons.map((lesson) => ({
                ...lesson,
                exerciseCount: countMap.get(lesson._id.toString())?.total ?? 0,
                activeExerciseCount: countMap.get(lesson._id.toString())?.active ?? 0,
            })),
        });
    }
    catch (err) {
        console.error('listLessons error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch lessons', 500);
    }
}
async function createLesson(req, res) {
    try {
        const order = req.body.order ?? (await nextOrder(Lesson_1.default, {}));
        const lesson = await Lesson_1.default.create({ ...req.body, order, updatedBy: adminId(req) });
        (0, response_1.sendSuccess)(res, { lesson }, 201);
    }
    catch (err) {
        console.error('createLesson error:', err);
        if (err?.code === 11000) {
            (0, response_1.sendError)(res, 'A lesson with that order already exists', 409);
            return;
        }
        (0, response_1.sendError)(res, 'Failed to create lesson', 500);
    }
}
async function updateLesson(req, res) {
    try {
        const lesson = await Lesson_1.default.findByIdAndUpdate(req.params['id'], { ...req.body, updatedBy: adminId(req) }, { new: true });
        if (!lesson) {
            (0, response_1.sendError)(res, 'Lesson not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, { lesson });
    }
    catch (err) {
        console.error('updateLesson error:', err);
        if (err?.code === 11000) {
            (0, response_1.sendError)(res, 'Another lesson already uses that order', 409);
            return;
        }
        (0, response_1.sendError)(res, 'Failed to update lesson', 500);
    }
}
async function deleteLesson(req, res) {
    try {
        const lesson = await Lesson_1.default.findById(req.params['id']);
        if (!lesson) {
            (0, response_1.sendError)(res, 'Lesson not found', 404);
            return;
        }
        await Promise.all([
            Exercise_1.default.deleteMany({ lessonId: lesson._id }),
            LessonProgress_1.default.deleteMany({ lessonId: lesson._id }),
        ]);
        await lesson.deleteOne();
        (0, response_1.sendSuccess)(res, { message: 'Lesson deleted' });
    }
    catch (err) {
        console.error('deleteLesson error:', err);
        (0, response_1.sendError)(res, 'Failed to delete lesson', 500);
    }
}
async function reorderLessons(req, res) {
    try {
        const orderedIds = req.body.orderedIds;
        const ok = await applyOrder(Lesson_1.default, orderedIds, 'order');
        if (!ok) {
            (0, response_1.sendError)(res, 'One or more lessons were not found', 400);
            return;
        }
        (0, response_1.sendSuccess)(res, { message: 'Lessons reordered' });
    }
    catch (err) {
        console.error('reorderLessons error:', err);
        (0, response_1.sendError)(res, 'Failed to reorder lessons', 500);
    }
}
// ── Exercises ────────────────────────────────────────────────────────────────
async function listExercises(req, res) {
    try {
        const exercises = await Exercise_1.default.find({ lessonId: req.params['id'] }).sort({ order: 1 }).lean();
        (0, response_1.sendSuccess)(res, { exercises });
    }
    catch (err) {
        console.error('listExercises error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch exercises', 500);
    }
}
async function createExercise(req, res) {
    try {
        const lessonId = req.params['id'];
        const order = req.body.order ?? (await nextOrder(Exercise_1.default, { lessonId }));
        const exercise = await Exercise_1.default.create({ ...req.body, lessonId, order, updatedBy: adminId(req) });
        (0, response_1.sendSuccess)(res, { exercise }, 201);
    }
    catch (err) {
        console.error('createExercise error:', err);
        (0, response_1.sendError)(res, 'Failed to create exercise', 500);
    }
}
async function updateExercise(req, res) {
    try {
        const exercise = await Exercise_1.default.findByIdAndUpdate(req.params['id'], { ...req.body, updatedBy: adminId(req) }, { new: true });
        if (!exercise) {
            (0, response_1.sendError)(res, 'Exercise not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, { exercise });
    }
    catch (err) {
        console.error('updateExercise error:', err);
        (0, response_1.sendError)(res, 'Failed to update exercise', 500);
    }
}
async function deleteExercise(req, res) {
    try {
        const exercise = await Exercise_1.default.findById(req.params['id']);
        if (!exercise) {
            (0, response_1.sendError)(res, 'Exercise not found', 404);
            return;
        }
        // Clean any saved progress that references this exercise.
        await Promise.all([
            LessonProgress_1.default.updateMany({ completedExerciseIds: exercise._id }, { $pull: { completedExerciseIds: exercise._id } }),
            LessonProgress_1.default.updateMany({ 'exercises.exerciseId': exercise._id }, { $pull: { exercises: { exerciseId: exercise._id } } }),
        ]);
        await exercise.deleteOne();
        (0, response_1.sendSuccess)(res, { message: 'Exercise deleted' });
    }
    catch (err) {
        console.error('deleteExercise error:', err);
        (0, response_1.sendError)(res, 'Failed to delete exercise', 500);
    }
}
async function reorderExercises(req, res) {
    try {
        const { orderedIds } = req.body;
        const ok = await applyOrder(Exercise_1.default, orderedIds, 'order');
        if (!ok) {
            (0, response_1.sendError)(res, 'One or more exercises were not found', 400);
            return;
        }
        (0, response_1.sendSuccess)(res, { message: 'Exercises reordered' });
    }
    catch (err) {
        console.error('reorderExercises error:', err);
        (0, response_1.sendError)(res, 'Failed to reorder exercises', 500);
    }
}
// ── Achievements ─────────────────────────────────────────────────────────────
async function listAchievements(_req, res) {
    try {
        const achievements = await Achievement_1.default.find().sort({ xpReward: 1 }).lean();
        (0, response_1.sendSuccess)(res, { achievements });
    }
    catch (err) {
        console.error('listAchievements error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch achievements', 500);
    }
}
async function createAchievement(req, res) {
    try {
        const achievement = await Achievement_1.default.create({ ...req.body, updatedBy: adminId(req) });
        (0, response_1.sendSuccess)(res, { achievement }, 201);
    }
    catch (err) {
        console.error('createAchievement error:', err);
        if (err?.code === 11000) {
            (0, response_1.sendError)(res, 'An achievement with that name already exists', 409);
            return;
        }
        (0, response_1.sendError)(res, 'Failed to create achievement', 500);
    }
}
async function updateAchievement(req, res) {
    try {
        const achievement = await Achievement_1.default.findByIdAndUpdate(req.params['id'], { ...req.body, updatedBy: adminId(req) }, { new: true });
        if (!achievement) {
            (0, response_1.sendError)(res, 'Achievement not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, { achievement });
    }
    catch (err) {
        console.error('updateAchievement error:', err);
        if (err?.code === 11000) {
            (0, response_1.sendError)(res, 'An achievement with that name already exists', 409);
            return;
        }
        (0, response_1.sendError)(res, 'Failed to update achievement', 500);
    }
}
async function deleteAchievement(req, res) {
    try {
        const achievement = await Achievement_1.default.findById(req.params['id']);
        if (!achievement) {
            (0, response_1.sendError)(res, 'Achievement not found', 404);
            return;
        }
        await Promise.all([
            UserAchievement_1.default.deleteMany({ achievementId: achievement._id }),
            achievement.deleteOne(),
        ]);
        (0, response_1.sendSuccess)(res, { message: 'Achievement deleted' });
    }
    catch (err) {
        console.error('deleteAchievement error:', err);
        (0, response_1.sendError)(res, 'Failed to delete achievement', 500);
    }
}
// ── Content pools (paragraphs, words, sentences) ────────────────────────────
function poolHandlers(model, findOptions) {
    return {
        list: async (req, res) => {
            try {
                const query = findOptions(req);
                const items = await model.find(query).sort({ createdAt: -1 }).limit(500).lean();
                (0, response_1.sendSuccess)(res, { items });
            }
            catch (err) {
                console.error('listPool error:', err);
                (0, response_1.sendError)(res, 'Failed to fetch content', 500);
            }
        },
        create: async (req, res) => {
            try {
                const item = await model.create({ ...req.body, updatedBy: adminId(req) });
                (0, response_1.sendSuccess)(res, { item }, 201);
            }
            catch (err) {
                console.error('createPool error:', err);
                if (err?.code === 11000) {
                    (0, response_1.sendError)(res, 'Content value already exists', 409);
                    return;
                }
                (0, response_1.sendError)(res, 'Failed to create content', 500);
            }
        },
        update: async (req, res) => {
            try {
                const item = await model.findByIdAndUpdate(req.params['id'], { ...req.body, updatedBy: adminId(req) }, { new: true });
                if (!item) {
                    (0, response_1.sendError)(res, 'Content not found', 404);
                    return;
                }
                (0, response_1.sendSuccess)(res, { item });
            }
            catch (err) {
                console.error('updatePool error:', err);
                if (err?.code === 11000) {
                    (0, response_1.sendError)(res, 'Content value already exists', 409);
                    return;
                }
                (0, response_1.sendError)(res, 'Failed to update content', 500);
            }
        },
        remove: async (req, res) => {
            try {
                const item = await model.findByIdAndDelete(req.params['id']);
                if (!item) {
                    (0, response_1.sendError)(res, 'Content not found', 404);
                    return;
                }
                (0, response_1.sendSuccess)(res, { message: 'Deleted' });
            }
            catch (err) {
                console.error('deletePool error:', err);
                (0, response_1.sendError)(res, 'Failed to delete content', 500);
            }
        },
    };
}
const testParagraph = poolHandlers(TestParagraph_1.default, (req) => {
    const q = {};
    const difficulty = String(req.query['difficulty'] ?? '');
    if (['beginner', 'intermediate', 'advanced'].includes(difficulty))
        q.difficulty = difficulty;
    return q;
});
const practiceParagraph = poolHandlers(PracticeParagraph_1.default, (req) => {
    const q = {};
    const difficulty = String(req.query['difficulty'] ?? '');
    if (['beginner', 'intermediate', 'advanced'].includes(difficulty))
        q.difficulty = difficulty;
    return q;
});
const wordPool = poolHandlers(Word_1.default, (req) => {
    const q = {};
    const difficulty = String(req.query['difficulty'] ?? '');
    if (['beginner', 'intermediate', 'advanced'].includes(difficulty))
        q.difficulty = difficulty;
    return q;
});
const sentencePool = poolHandlers(Sentence_1.default, (req) => {
    const q = {};
    const difficulty = String(req.query['difficulty'] ?? '');
    if (['beginner', 'intermediate', 'advanced'].includes(difficulty))
        q.difficulty = difficulty;
    return q;
});
exports.adminTestParagraphs = testParagraph;
exports.adminPracticeParagraphs = practiceParagraph;
exports.adminWords = wordPool;
exports.adminSentences = sentencePool;
// ── Platform settings (leaderboard, games config) ───────────────────────────
async function getSettings(_req, res) {
    try {
        const rows = await PlatformSetting_1.default.find().lean();
        const settings = {};
        for (const row of rows)
            settings[row.key] = row.value;
        (0, response_1.sendSuccess)(res, {
            settings,
            defaults: {
                'leaderboard.minAccuracy': 90,
                'leaderboard.topLimit': 50,
                'certificate.durationSeconds': 60,
            },
        });
    }
    catch (err) {
        console.error('getSettings error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch platform settings', 500);
    }
}
const WRITABLE_KEYS = {
    'leaderboard.minAccuracy': (v) => typeof v === 'number' && v >= 60 && v <= 100,
    'leaderboard.topLimit': (v) => typeof v === 'number' && v >= 10 && v <= 200,
    'games.wordRush.chunkWords': (v) => typeof v === 'number' && v >= 20 && v <= 400,
    'certificate.durationSeconds': (v) => typeof v === 'number' && v >= 30 && v <= 900,
};
async function updateSettings(req, res) {
    try {
        const incoming = req.body.settings ?? {};
        const keys = Object.keys(incoming);
        if (!keys.length) {
            (0, response_1.sendError)(res, 'No settings provided', 400);
            return;
        }
        for (const key of keys) {
            const validateValue = WRITABLE_KEYS[key];
            if (!validateValue) {
                (0, response_1.sendError)(res, `Setting "${key}" is not configurable`, 400);
                return;
            }
            if (!validateValue(incoming[key])) {
                (0, response_1.sendError)(res, `Invalid value for "${key}"`, 400);
                return;
            }
        }
        for (const key of keys) {
            await PlatformSetting_1.default.updateOne({ key }, { $set: { value: incoming[key], updatedBy: adminId(req) } }, { upsert: true });
        }
        const rows = await PlatformSetting_1.default.find().lean();
        const settings = {};
        for (const row of rows)
            settings[row.key] = row.value;
        (0, response_1.sendSuccess)(res, { settings });
    }
    catch (err) {
        console.error('updateSettings error:', err);
        (0, response_1.sendError)(res, 'Failed to update platform settings', 500);
    }
}
//# sourceMappingURL=admin.controller.js.map