"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCertificateParagraphs = void 0;
exports.getCertificateParagraph = getCertificateParagraph;
const CertificateParagraph_1 = __importDefault(require("../models/CertificateParagraph"));
const User_1 = __importDefault(require("../models/User"));
const TypingSession_1 = __importDefault(require("../models/TypingSession"));
const certificateParagraph_service_1 = require("../services/certificateParagraph.service");
const response_1 = require("../utils/response");
function readDifficulty(raw) {
    return raw === 'medium' || raw === 'hard' ? raw : 'easy';
}
/**
 * Public certificate-test paragraph endpoint (signed-in visitors get persistent
 * history, guests pass `?exclude=` with their localStorage history). Never
 * returns inactive paragraphs, never repeats until the pool cycles, and errors
 * (503) instead of ever sending an empty test.
 */
async function getCertificateParagraph(req, res) {
    try {
        const difficulty = readDifficulty(req.query.difficulty);
        const user = req.user ?? null;
        const exclude = (0, certificateParagraph_service_1.parseExcludeQuery)(req.query.exclude);
        const paragraph = await (0, certificateParagraph_service_1.selectCertificateParagraph)({ user, difficulty, exclude });
        if (!paragraph) {
            (0, response_1.sendError)(res, 'No certificate content available for this difficulty', 503);
            return;
        }
        (0, response_1.sendSuccess)(res, {
            paragraph: {
                _id: paragraph._id,
                content: paragraph.content,
                difficulty: paragraph.difficulty,
            },
        });
    }
    catch (err) {
        console.error('getCertificateParagraph error:', err);
        (0, response_1.sendError)(res, 'Failed to load certificate content', 500);
    }
}
// ── Admin library management (routes are protected by authenticate + requireAdmin) ──
exports.adminCertificateParagraphs = {
    list: async (req, res) => {
        try {
            const query = {};
            const difficulty = String(req.query['difficulty'] ?? '');
            if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
                query.difficulty = difficulty;
            }
            const status = String(req.query['status'] ?? '');
            if (status === 'active')
                query.isActive = true;
            if (status === 'inactive')
                query.isActive = false;
            const search = String(req.query['search'] ?? '').trim();
            if (search)
                query.content = { $regex: search, $options: 'i' };
            const items = await CertificateParagraph_1.default.find(query).sort({ createdAt: -1 }).limit(500).lean();
            (0, response_1.sendSuccess)(res, { items });
        }
        catch (err) {
            console.error('certificateParagraphs.list error:', err);
            (0, response_1.sendError)(res, 'Failed to fetch certificate paragraphs', 500);
        }
    },
    create: async (req, res) => {
        try {
            const { content, difficulty, isActive = true } = req.body;
            const item = await CertificateParagraph_1.default.create({
                content,
                difficulty,
                isActive,
                updatedBy: req.user?._id,
            });
            (0, response_1.sendSuccess)(res, { item }, 201);
        }
        catch (err) {
            console.error('certificateParagraphs.create error:', err);
            if (err?.code === 11000) {
                (0, response_1.sendError)(res, 'A certificate paragraph with that text already exists', 409);
                return;
            }
            (0, response_1.sendError)(res, 'Failed to create certificate paragraph', 500);
        }
    },
    update: async (req, res) => {
        try {
            const id = String(req.params['id'] ?? '');
            const updates = { updatedBy: req.user?._id };
            const { content, difficulty, isActive } = req.body;
            if (typeof content === 'string')
                updates.content = content;
            if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
                updates.difficulty = difficulty;
            }
            if (typeof isActive === 'boolean')
                updates.isActive = isActive;
            const item = await CertificateParagraph_1.default.findByIdAndUpdate(id, updates, { new: true });
            if (!item) {
                (0, response_1.sendError)(res, 'Certificate paragraph not found', 404);
                return;
            }
            (0, response_1.sendSuccess)(res, { item });
        }
        catch (err) {
            console.error('certificateParagraphs.update error:', err);
            if (err?.code === 11000) {
                (0, response_1.sendError)(res, 'A certificate paragraph with that text already exists', 409);
                return;
            }
            (0, response_1.sendError)(res, 'Failed to update certificate paragraph', 500);
        }
    },
    remove: async (req, res) => {
        try {
            const id = String(req.params['id'] ?? '');
            const [referencedByUser, referencedBySession] = await Promise.all([
                User_1.default.exists({ 'certificateParagraphHistory.paragraphId': id }),
                TypingSession_1.default.exists({ certificateParagraphId: id }),
            ]);
            if (referencedByUser || referencedBySession) {
                (0, response_1.sendError)(res, 'This paragraph is referenced by user history or completed tests. Disable it instead of deleting.', 409);
                return;
            }
            const item = await CertificateParagraph_1.default.findByIdAndDelete(id);
            if (!item) {
                (0, response_1.sendError)(res, 'Certificate paragraph not found', 404);
                return;
            }
            (0, response_1.sendSuccess)(res, { message: 'Certificate paragraph deleted' });
        }
        catch (err) {
            console.error('certificateParagraphs.remove error:', err);
            (0, response_1.sendError)(res, 'Failed to delete certificate paragraph', 500);
        }
    },
};
//# sourceMappingURL=certificateParagraph.controller.js.map