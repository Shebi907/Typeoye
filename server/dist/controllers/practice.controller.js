"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePracticeSchema = void 0;
exports.generatePractice = generatePractice;
exports.getPracticeOverview = getPracticeOverview;
const zod_1 = require("zod");
const WeakKey_1 = __importDefault(require("../models/WeakKey"));
const TypingResult_1 = __importDefault(require("../models/TypingResult"));
const TypingSession_1 = __importDefault(require("../models/TypingSession"));
const PracticeParagraph_1 = __importDefault(require("../models/PracticeParagraph"));
const Word_1 = __importDefault(require("../models/Word"));
const Sentence_1 = __importDefault(require("../models/Sentence"));
const response_1 = require("../utils/response");
const practiceContent_1 = require("../data/practiceContent");
const TYPES = ['character', 'combination', 'word', 'sentence', 'paragraph', 'weak', 'quick', 'custom'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
// ── Character set selection (deterministic per difficulty + rotation) ──────
const characterSets = [
    ['a', 's', 'd', 'f'], ['j', 'k', 'l', ';'], ['q', 'w', 'e', 'r'], ['t', 'y', 'u', 'i'],
    ['z', 'x', 'c', 'v'], ['b', 'n', 'm'],
];
const letterKeys = (chars) => [...new Set(chars.replace(/[^a-z]/gi, '').split(''))];
// ── Helpers ────────────────────────────────────────────────────────────────
exports.generatePracticeSchema = zod_1.z.object({
    type: zod_1.z.enum(TYPES),
    difficulty: zod_1.z.enum(DIFFICULTIES).default('beginner'),
    duration: zod_1.z.union([zod_1.z.literal(15), zod_1.z.literal(30), zod_1.z.literal(60), zod_1.z.literal(120), zod_1.z.literal(300), zod_1.z.literal(600), zod_1.z.literal(900)]).default(300),
    targetKeys: zod_1.z.array(zod_1.z.string().min(1).max(10)).max(20).default([]),
    wordCount: zod_1.z.number().int().min(10).max(200).default(40),
    rotation: zod_1.z.number().int().min(0).default(0),
    customText: zod_1.z.string().max(5000).optional(),
    session: zod_1.z.enum(['0', '1', 'true', 'false']).optional(),
});
const normal = (content) => content.trim().replace(/\s+/g, ' ');
/** Number of words a session should comfortably cover given its duration (with headroom). */
function sessionWordTarget(durationSeconds) {
    return Math.ceil((60 * (durationSeconds / 60)) * 1.5) + 60;
}
function formatDuration(seconds) {
    if (seconds < 60)
        return `${seconds}-Second`;
    if (seconds % 60 === 0)
        return `${seconds / 60}-Minute`;
    return `${seconds}-Second`;
}
function dbVariationBlocks(items, seed, blockSize, maxBlocks) {
    const out = [];
    const count = Math.min(maxBlocks, Math.max(1, Math.ceil(items.length / blockSize)));
    for (let i = 0; i < count; i++) {
        const rand = mulberry(seed + ':' + i);
        out.push((0, practiceContent_1.seededShuffle)(items, rand).slice(0, blockSize).join(' '));
    }
    return out;
}
function mulberry(seed) {
    let a = (0, practiceContent_1.hashSeed)(seed);
    return () => {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
async function generatePractice(req, res) {
    try {
        const rawKeys = typeof req.query['targetKeys'] === 'string' ? req.query['targetKeys'] : '';
        const input = { ...req.query, targetKeys: rawKeys.split(',').map((k) => k.trim()).filter(Boolean) };
        const parsed = exports.generatePracticeSchema.parse({ ...input, wordCount: input.wordCount ? Number(input.wordCount) : undefined, duration: input.duration ? Number(input.duration) : undefined, rotation: input.rotation ? Number(input.rotation) : 0 });
        if (parsed.targetKeys.length > 12)
            parsed.targetKeys = parsed.targetKeys.slice(0, 12);
        const wantSessionPool = parsed.session ? ['1', 'true'].includes(parsed.session) : false;
        const rotation = Math.max(0, Math.floor(parsed.rotation || 0));
        const userId = req.user?._id;
        const weakKeys = userId ? await WeakKey_1.default.find({ userId, isWeak: true }).sort({ errorRate: -1 }).limit(5) : [];
        let type = parsed.type;
        let difficulty = parsed.difficulty;
        let focusKeys = parsed.targetKeys.map((key) => key.toLowerCase());
        if (type === 'quick') {
            focusKeys = focusKeys.length ? focusKeys : weakKeys.map((key) => key.key);
            difficulty = weakKeys.length && !parsed.targetKeys.length ? (weakKeys[0].errorRate > 30 ? 'beginner' : 'intermediate') : difficulty;
            type = focusKeys.length ? 'weak' : 'sentence';
        }
        if (type === 'weak' && !focusKeys.length) {
            focusKeys = weakKeys.map((key) => key.key);
            if (!focusKeys.length)
                focusKeys = ['t', 'h'];
        }
        if (type === 'character' && !focusKeys.length) {
            focusKeys = characterSets[(0, practiceContent_1.hashSeed)(`${difficulty}|${rotation}`) % characterSets.length];
        }
        if (type === 'custom') {
            const content = parsed.customText?.trim() ? normal(parsed.customText) : '';
            if (!content) {
                (0, response_1.sendError)(res, 'Add some text to practice first.', 400);
                return;
            }
            const exercise = { type, difficulty, duration: parsed.duration, focusKeys, content, summary: `${formatDuration(parsed.duration)} Custom Practice` };
            (0, response_1.sendSuccess)(res, { exercise: wantSessionPool ? { ...exercise, queue: [content], rotation: 0, poolLength: 1 } : { ...exercise, rotation: 0, poolLength: 1 } });
            return;
        }
        const [dbParagraphs, dbWords, dbSentences] = await Promise.all([
            type === 'paragraph' ? PracticeParagraph_1.default.find({ difficulty }).lean() : [],
            type === 'word' ? Word_1.default.find({ difficulty }).lean() : [],
            type === 'sentence' ? Sentence_1.default.find({ difficulty }).lean() : [],
        ]);
        const codeCount = (0, practiceContent_1.variationCount)(type);
        const pool = [];
        for (let i = 0; i < codeCount; i++)
            pool.push((0, practiceContent_1.variationAt)(type, difficulty, focusKeys, i));
        if (type === 'paragraph') {
            for (const p of dbParagraphs)
                pool.push(normal(p.content));
        }
        else if (type === 'word') {
            const words = dbWords.map((w) => w.text.trim()).filter(Boolean);
            if (words.length)
                pool.push(...dbVariationBlocks(words, `${type}|${difficulty}|db`, 20, 20));
        }
        else if (type === 'sentence') {
            const sentences = dbSentences.map((s) => normal(s.text)).filter(Boolean);
            if (sentences.length)
                pool.push(...dbVariationBlocks(sentences, `${type}|${difficulty}|db`, 4, 20));
        }
        if (!pool.length) {
            (0, response_1.sendError)(res, 'No practice content was generated. Please adjust your options.', 400);
            return;
        }
        const poolLength = pool.length;
        const avgWords = Math.max(1, pool.reduce((sum, str) => sum + normal(str).split(' ').length, 0) / poolLength);
        const needed = Math.max(1, Math.ceil(sessionWordTarget(parsed.duration) / avgWords));
        const start = rotation % poolLength;
        const content = pool[start];
        const queue = [];
        for (let i = 1; i < needed; i++)
            queue.push(pool[(start + i) % poolLength]);
        if ((type === 'character' || type === 'combination') && !focusKeys.length) {
            focusKeys = letterKeys(content);
        }
        const focusLabel = focusKeys.length ? ` — Focus: ${[...new Set(focusKeys)].map((key) => key.toUpperCase()).join(', ')}` : '';
        const summary = `${formatDuration(parsed.duration)} ${type === 'weak' ? 'Weak Key' : type[0].toUpperCase() + type.slice(1)} Practice${focusLabel}`;
        const exercise = { type, difficulty, duration: parsed.duration, focusKeys, content, summary, rotation: start, poolLength };
        if (wantSessionPool)
            (0, response_1.sendSuccess)(res, { exercise: { ...exercise, queue } });
        else
            (0, response_1.sendSuccess)(res, { exercise });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            (0, response_1.sendError)(res, err.issues[0]?.message ?? 'Invalid practice options', 400);
            return;
        }
        console.error('generatePractice error:', err);
        (0, response_1.sendError)(res, 'Failed to generate practice.', 500);
    }
}
async function getPracticeOverview(req, res) {
    try {
        const now = new Date();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [weakKeys, latest, todaySessions] = await Promise.all([
            WeakKey_1.default.find({ userId: req.user._id, isWeak: true }).sort({ errorRate: -1 }).limit(5),
            TypingResult_1.default.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(5),
            TypingSession_1.default.find({ userId: req.user._id, mode: 'practice', startTime: { $gte: dayStart } }),
        ]);
        const accuracy = latest.length ? latest.reduce((sum, result) => sum + result.accuracy, 0) / latest.length : 100;
        (0, response_1.sendSuccess)(res, {
            weakKeys,
            today: {
                count: todaySessions.length,
                seconds: todaySessions.reduce((sum, session) => sum + (session.durationSeconds ?? 0), 0),
            },
            recommendation: {
                duration: accuracy < 90 ? 300 : 120,
                difficulty: accuracy < 85 ? 'beginner' : accuracy < 95 ? 'intermediate' : 'advanced',
                focusKeys: weakKeys.map((key) => key.key),
                type: weakKeys.length ? 'weak' : 'sentence',
            },
        });
    }
    catch (err) {
        console.error('getPracticeOverview error:', err);
        (0, response_1.sendError)(res, 'Failed to load practice overview', 500);
    }
}
//# sourceMappingURL=practice.controller.js.map