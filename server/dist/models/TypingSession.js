"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const typedWordSchema = new mongoose_1.Schema({
    word: { type: String, required: true },
    typed: { type: String, required: true },
    correct: { type: Boolean, required: true },
    timeTakenMs: { type: Number, required: true },
}, { _id: false });
const typingSessionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, enum: ['test', 'practice', 'lesson', 'game'], required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationSeconds: { type: Number, required: true },
    typedWords: [typedWordSchema],
    textSource: { type: String, enum: ['generated', 'lesson', 'custom'], required: true },
    exerciseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Exercise' },
    clientWpm: { type: Number, default: 0 },
    clientAccuracy: { type: Number, default: 0 },
    certificateParagraphId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CertificateParagraph' },
    certificateParagraphText: { type: String, maxlength: 4000 },
}, { timestamps: true });
typingSessionSchema.index({ userId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('TypingSession', typingSessionSchema);
//# sourceMappingURL=TypingSession.js.map