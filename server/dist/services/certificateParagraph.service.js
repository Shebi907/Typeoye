"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HISTORY_LIMIT = exports.CERT_DIFFICULTIES = void 0;
exports.selectCertificateParagraph = selectCertificateParagraph;
exports.parseExcludeQuery = parseExcludeQuery;
const mongoose_1 = require("mongoose");
const CertificateParagraph_1 = __importDefault(require("../models/CertificateParagraph"));
const User_1 = __importDefault(require("../models/User"));
exports.CERT_DIFFICULTIES = ['easy', 'medium', 'hard'];
/** How many recent paragraphs are kept per user (sliding window). */
exports.HISTORY_LIMIT = 60;
function asObjectIds(values) {
    const ids = [];
    for (const value of values) {
        if (mongoose_1.Types.ObjectId.isValid(value))
            ids.push(new mongoose_1.Types.ObjectId(value));
    }
    return ids;
}
/**
 * Pick the next certificate-test paragraph for a difficulty.
 *
 * Rules (from the cert-content spec):
 *  1. Only active paragraphs are eligible.
 *  2. Exclude the user's recent history (server-side for signed-in users) and
 *     the caller's explicit `exclude` list (guests keep client-side history).
 *  3. Random pick from the remaining pool — never Math.random() over everything.
 *  4. When the pool is exhausted, reset the cycle but keep the most recently
 *     used paragraph excluded so the same text never appears twice in a row.
 *  5. Signed-in users persist their used ids (sliding window capped).
 */
async function selectCertificateParagraph(options) {
    const { user, difficulty, exclude } = options;
    const used = new Set();
    if (user) {
        for (const entry of user.certificateParagraphHistory ?? []) {
            if (entry.difficulty === difficulty)
                used.add(String(entry.paragraphId));
        }
    }
    for (const id of exclude ?? [])
        used.add(id);
    const pool = await CertificateParagraph_1.default.find({ difficulty, isActive: true }).lean();
    const lastUsedId = Array.from(used)[used.size - 1] ?? null;
    const eligible = pool.filter((paragraph) => !used.has(String(paragraph._id)));
    let chosen;
    if (eligible.length > 0) {
        chosen = eligible[Math.floor(Math.random() * eligible.length)];
    }
    else {
        // Pool exhausted — reset the cycle, still never repeating the
        // immediately-previous paragraph.
        const resetEligible = pool.filter((paragraph) => String(paragraph._id) !== lastUsedId);
        if (resetEligible.length === 0)
            return null;
        chosen = resetEligible[Math.floor(Math.random() * resetEligible.length)];
    }
    const selected = {
        _id: chosen._id,
        content: chosen.content,
        difficulty: chosen.difficulty,
    };
    if (user) {
        await User_1.default.updateOne({ _id: user._id }, {
            $push: {
                certificateParagraphHistory: {
                    $each: [
                        {
                            difficulty: selected.difficulty,
                            paragraphId: selected._id,
                            usedAt: new Date(),
                        },
                    ],
                    $slice: -exports.HISTORY_LIMIT,
                },
            },
        });
    }
    return selected;
}
/** Resolve an optional `exclude=a,b,c` query into a clean id list. */
function parseExcludeQuery(raw) {
    if (typeof raw !== 'string' || raw.trim() === '')
        return [];
    const ids = asObjectIds(raw.split(',').map((part) => part.trim()));
    return Array.from(new Set(ids.map((id) => id.toString())));
}
//# sourceMappingURL=certificateParagraph.service.js.map