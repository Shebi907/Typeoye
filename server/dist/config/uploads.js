"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVATARS_DIR = exports.UPLOADS_DIR = void 0;
exports.ensureUploadDirs = ensureUploadDirs;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/** Root folder for user-uploaded files, resolved from the server process cwd. */
exports.UPLOADS_DIR = path_1.default.resolve(process.cwd(), 'uploads');
exports.AVATARS_DIR = path_1.default.join(exports.UPLOADS_DIR, 'avatars');
/** Create upload folders (idempotent) before the app starts serving them. */
function ensureUploadDirs() {
    fs_1.default.mkdirSync(exports.AVATARS_DIR, { recursive: true });
}
//# sourceMappingURL=uploads.js.map