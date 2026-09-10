"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionSchema = void 0;
exports.getRandomParagraph = getRandomParagraph;
exports.submitSession = submitSession;
exports.getResults = getResults;
exports.getResult = getResult;
const zod_1 = require("zod");
const TypingResult_1 = __importDefault(require("../models/TypingResult"));
const session_service_1 = require("../services/session.service");
const response_1 = require("../utils/response");
const TestParagraph_1 = __importDefault(require("../models/TestParagraph"));
exports.sessionSchema = zod_1.z.object({
    mode: zod_1.z.enum(['test', 'practice', 'lesson', 'game']),
    startTime: zod_1.z.string().datetime(),
    endTime: zod_1.z.string().datetime(),
    typedWords: zod_1.z
        .array(zod_1.z.object({
        word: zod_1.z.string(),
        typed: zod_1.z.string(),
        correct: zod_1.z.boolean(),
        timeTakenMs: zod_1.z.number().min(0),
    }))
        .min(1),
    textSource: zod_1.z.enum(['generated', 'lesson', 'custom']),
    exerciseId: zod_1.z.string().optional(),
    clientWpm: zod_1.z.number().optional().default(0),
    clientAccuracy: zod_1.z.number().optional().default(0),
    practiceType: zod_1.z.string().optional(),
    practiceDifficulty: zod_1.z.number().int().min(1).max(3).optional(),
    focusKeys: zod_1.z.array(zod_1.z.string().min(1).max(1)).max(8).optional(),
    // Certificate runs: record which paragraph was used. The text is snapshotted
    // at submit time so later edits to the library never change past history.
    certificateParagraphId: zod_1.z.string().optional(),
    certificateParagraphText: zod_1.z.string().max(4000).optional(),
});
async function getRandomParagraph(req, res) {
    try {
        const difficulty = req.query['difficulty'];
        const match = typeof difficulty === 'string' && ['beginner', 'intermediate', 'advanced'].includes(difficulty) ? { difficulty } : {};
        const [paragraph] = await TestParagraph_1.default.aggregate([{ $match: match }, { $sample: { size: 1 } }]);
        if (!paragraph) {
            (0, response_1.sendError)(res, 'No test paragraphs are available. Run the database seed first.', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, { paragraph });
    }
    catch (err) {
        console.error('getRandomParagraph error:', err);
        (0, response_1.sendError)(res, 'Failed to load a test paragraph', 500);
    }
}
async function submitSession(req, res) {
    try {
        const user = req.user;
        const body = req.body;
        const startTime = new Date(body.startTime);
        const endTime = new Date(body.endTime);
        const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
        if (durationSeconds <= 0) {
            (0, response_1.sendError)(res, 'Invalid session duration', 400);
            return;
        }
        const { result, newAchievements, xpEarned, leveledUp, prevXP, newXP, level, prevLevel, levelTitle, xpBreakdown, } = await (0, session_service_1.processVerifiedTypingSession)(user._id, body, startTime, endTime);
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (err) {
        console.error('submitSession error:', err);
        (0, response_1.sendError)(res, err instanceof Error && err.statusCode === 400 ? err.message : 'Failed to submit session', err instanceof Error && err.statusCode === 400 ? 400 : 500);
    }
}
async function getResults(req, res) {
    try {
        const user = req.user;
        const page = Math.max(1, parseInt(req.query['page']) || 1);
        const limit = Math.min(50, parseInt(req.query['limit']) || 10);
        const skip = (page - 1) * limit;
        const [results, total] = await Promise.all([
            TypingResult_1.default.find({ userId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            TypingResult_1.default.countDocuments({ userId: user._id }),
        ]);
        (0, response_1.sendSuccess)(res, { results, total, page, pages: Math.ceil(total / limit) });
    }
    catch (err) {
        console.error('getResults error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch results', 500);
    }
}
async function getResult(req, res) {
    try {
        const user = req.user;
        const result = await TypingResult_1.default.findById(req.params['id']);
        if (!result) {
            (0, response_1.sendError)(res, 'Result not found', 404);
            return;
        }
        if (!result.userId || result.userId.toString() !== user._id.toString()) {
            (0, response_1.sendError)(res, 'Unauthorized', 403);
            return;
        }
        (0, response_1.sendSuccess)(res, { result });
    }
    catch (err) {
        console.error('getResult error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch result', 500);
    }
}
//# sourceMappingURL=typing.controller.js.map