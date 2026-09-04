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
exports.WEAK_KEY_MIN_ERROR_RATE = exports.WEAK_KEY_MIN_ATTEMPTS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.WEAK_KEY_MIN_ATTEMPTS = 20;
exports.WEAK_KEY_MIN_ERROR_RATE = 15;
const weakKeySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, key: { type: String, required: true, maxlength: 1 },
    errorCount: { type: Number, default: 0 }, totalAttempts: { type: Number, default: 0 }, errorRate: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }, lastMistakeAt: { type: Date }, isWeak: { type: Boolean, default: false }, qualifiedAt: { type: Date },
});
weakKeySchema.index({ userId: 1, key: 1 }, { unique: true });
weakKeySchema.index({ userId: 1, isWeak: 1, errorRate: -1 });
exports.default = mongoose_1.default.model('WeakKey', weakKeySchema);
//# sourceMappingURL=WeakKey.js.map