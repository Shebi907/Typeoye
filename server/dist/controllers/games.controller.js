"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameSchema = void 0;
exports.completeGame = completeGame;
exports.getGameHistory = getGameHistory;
const zod_1 = require("zod");
const GameResult_1 = __importDefault(require("../models/GameResult"));
const typing_controller_1 = require("./typing.controller");
const session_service_1 = require("../services/session.service");
const response_1 = require("../utils/response");
const GAME_TYPES = ['typingRace', 'fallingWords', 'suddenDeath'];
exports.gameSchema = typing_controller_1.sessionSchema.extend({
    game: zod_1.z.enum(GAME_TYPES),
    score: zod_1.z.number().int().min(0).optional(),
    winner: zod_1.z.enum(['user', 'opponent']).optional(),
    opponentWpm: zod_1.z.number().min(1).max(500).optional(),
});
/**
 * Submits a completed game session.
 * Authed users: session saved to DB (TypingResult + GameResult), XP/achievements awarded.
 * Guests: computed stats returned without persistence.
 */
async function completeGame(req, res) {
    try {
        const body = req.body;
        const user = req.user;
        const startTime = new Date(body.startTime);
        const endTime = new Date(body.endTime);
        if (startTime.getTime() >= endTime.getTime()) {
            (0, response_1.sendError)(res, 'Invalid session duration', 400);
            return;
        }
        if (user) {
            const processed = await (0, session_service_1.processVerifiedTypingSession)(user._id, body, startTime, endTime);
            const gameResult = await GameResult_1.default.create({
                userId: user._id,
                game: body.game,
                score: body.score ?? 0,
                wpm: processed.result.wpm,
                accuracy: processed.result.accuracy,
                duration: Math.round((endTime.getTime() - startTime.getTime()) / 1000),
                winner: body.winner,
                opponentWpm: body.opponentWpm,
            });
            (0, response_1.sendSuccess)(res, {
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
        }
        else {
            // Guest: compute stats client-side, return without saving
            const correctWords = body.typedWords.filter((w) => w.correct).length;
            const attemptedWords = body.typedWords.length;
            const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
            (0, response_1.sendSuccess)(res, {
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
    }
    catch (err) {
        console.error('completeGame error:', err);
        (0, response_1.sendError)(res, 'Failed to submit game', 500);
    }
}
async function getGameHistory(req, res) {
    try {
        const user = req.user;
        const game = req.query['game'];
        const match = { userId: user._id };
        if (typeof game === 'string' && GAME_TYPES.includes(game)) {
            match.game = game;
        }
        const results = await GameResult_1.default.find(match).sort({ createdAt: -1 }).limit(50).lean();
        (0, response_1.sendSuccess)(res, { results });
    }
    catch (err) {
        console.error('getGameHistory error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch game history', 500);
    }
}
//# sourceMappingURL=games.controller.js.map