"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateSettingsSchema = void 0;
exports.getProfile = getProfile;
exports.updateSettings = updateSettings;
exports.getAchievements = getAchievements;
exports.updateAvatar = updateAvatar;
exports.removeAvatar = removeAvatar;
exports.changePassword = changePassword;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const User_1 = __importDefault(require("../models/User"));
const Profile_1 = __importDefault(require("../models/Profile"));
const Settings_1 = __importDefault(require("../models/Settings"));
const UserProgress_1 = __importDefault(require("../models/UserProgress"));
const achievement_service_1 = require("../services/achievement.service");
const session_service_1 = require("../services/session.service");
const gamification_service_1 = require("../services/gamification.service");
const uploads_1 = require("../config/uploads");
const response_1 = require("../utils/response");
exports.updateSettingsSchema = zod_1.z.object({
    theme: zod_1.z.enum(['light', 'dark', 'system']).optional(),
    font: zod_1.z.enum(['jetbrains', 'fira', 'cascadia']).optional(),
    fontSize: zod_1.z.number().min(12).max(32).optional(),
    soundEnabled: zod_1.z.boolean().optional(),
    caretStyle: zod_1.z.enum(['bar', 'block', 'underline']).optional(),
    testDuration: zod_1.z.union([zod_1.z.literal(60), zod_1.z.literal(120), zod_1.z.literal(300), zod_1.z.literal(600), zod_1.z.literal(900)]).optional(),
    wordCount: zod_1.z.number().min(10).max(100).optional(),
    includeNumbers: zod_1.z.boolean().optional(),
    includePunctuation: zod_1.z.boolean().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
const AVATAR_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const EXT_MAP = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
/** Verify the decoded bytes actually match the declared image format (never
 *  trust the client's claimed MIME type alone — reject polyglot/renamed files
 *  that could be served as malicious content on the same origin). */
function matchesImageSignature(ext, buffer) {
    const b = buffer.subarray(0, 16);
    switch (ext) {
        case 'png':
            return b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
        case 'jpg':
            return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
        case 'webp':
            return b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
        case 'gif':
            return b.length >= 6 && (b.toString('ascii', 0, 4) === 'GIF8');
        default:
            return false;
    }
}
async function getProfile(req, res) {
    try {
        const { id } = req.params;
        const synced = await (0, gamification_service_1.syncProfileLevel)(id);
        if (!synced) {
            (0, response_1.sendError)(res, 'Profile not found', 404);
            return;
        }
        const [progress, bestWpm] = await Promise.all([
            UserProgress_1.default.findOne({ userId: id }),
            (0, session_service_1.getTestBestWpm)(id),
        ]);
        const profileProgress = progress ? { ...progress.toObject(), bestWpm } : null;
        (0, response_1.sendSuccess)(res, { profile: synced, progress: profileProgress });
    }
    catch (err) {
        console.error('getProfile error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch profile', 500);
    }
}
async function updateSettings(req, res) {
    try {
        const user = req.user;
        const updates = req.body;
        const settings = await Settings_1.default.findOneAndUpdate({ userId: user._id }, { $set: updates }, { new: true, upsert: true });
        (0, response_1.sendSuccess)(res, { settings });
    }
    catch (err) {
        console.error('updateSettings error:', err);
        (0, response_1.sendError)(res, 'Failed to update settings', 500);
    }
}
async function getAchievements(req, res) {
    try {
        const user = req.user;
        // All active achievements with unlock status + live progress (server-derived)
        const achievements = await (0, achievement_service_1.getUserAchievements)(user._id);
        (0, response_1.sendSuccess)(res, { achievements });
    }
    catch (err) {
        console.error('getAchievements error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch achievements', 500);
    }
}
/**
 * Store a user's profile picture. Accepts a base64 data URL (resized on the
 * client), writes it to /uploads/avatars and stores the URL on the Profile.
 */
async function updateAvatar(req, res) {
    try {
        const dataUrl = req.body?.dataUrl;
        const match = typeof dataUrl === 'string' ? dataUrl.match(AVATAR_PATTERN) : null;
        if (!match) {
            (0, response_1.sendError)(res, 'Invalid image data', 400);
            return;
        }
        const mimeName = match[1] === 'jpg' ? 'jpeg' : match[1];
        const ext = EXT_MAP[`image/${mimeName}`];
        if (!ext) {
            (0, response_1.sendError)(res, 'Unsupported image format', 400);
            return;
        }
        const buffer = Buffer.from(match[2], 'base64');
        if (buffer.length === 0 || buffer.length > AVATAR_MAX_BYTES) {
            (0, response_1.sendError)(res, 'Image must be a valid file under 2 MB', 400);
            return;
        }
        if (!matchesImageSignature(ext, buffer)) {
            (0, response_1.sendError)(res, 'Image content does not match its file type', 400);
            return;
        }
        const profile = await Profile_1.default.findOne({ userId: req.user._id });
        if (!profile) {
            (0, response_1.sendError)(res, 'Profile not found', 404);
            return;
        }
        // Remove the previous file if it is one of our avatars (never trust the path).
        const previous = profile.avatarUrl?.split('/').pop();
        if (previous) {
            const oldPath = path_1.default.join(uploads_1.AVATARS_DIR, previous);
            if (oldPath.startsWith(uploads_1.AVATARS_DIR)) {
                try {
                    await fs_1.default.promises.unlink(oldPath);
                }
                catch { /* best-effort */ }
            }
        }
        await fs_1.default.promises.mkdir(uploads_1.AVATARS_DIR, { recursive: true });
        const filename = `${req.user._id}-${Date.now()}.${ext}`;
        await fs_1.default.promises.writeFile(path_1.default.join(uploads_1.AVATARS_DIR, filename), buffer);
        profile.avatarUrl = `/uploads/avatars/${filename}`;
        await profile.save();
        (0, response_1.sendSuccess)(res, { profile: { ...profile.toObject(), level: profile.level, levelTitle: profile.levelTitle, totalXP: profile.totalXP }, ok: true });
    }
    catch (err) {
        console.error('updateAvatar error:', err);
        (0, response_1.sendError)(res, 'Failed to update profile picture', 500);
    }
}
/** Remove a user's profile picture and its stored file. */
async function removeAvatar(req, res) {
    try {
        const profile = await Profile_1.default.findOne({ userId: req.user._id });
        if (!profile) {
            (0, response_1.sendError)(res, 'Profile not found', 404);
            return;
        }
        const previous = profile.avatarUrl?.split('/').pop();
        if (previous) {
            const oldPath = path_1.default.join(uploads_1.AVATARS_DIR, previous);
            if (oldPath.startsWith(uploads_1.AVATARS_DIR)) {
                try {
                    await fs_1.default.promises.unlink(oldPath);
                }
                catch { /* best-effort */ }
            }
        }
        profile.avatarUrl = undefined;
        await profile.save();
        (0, response_1.sendSuccess)(res, { profile: profile.toObject(), ok: true });
    }
    catch (err) {
        console.error('removeAvatar error:', err);
        (0, response_1.sendError)(res, 'Failed to remove profile picture', 500);
    }
}
/** Verify the current password and replace it with a newly hashed one. */
async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        const matches = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!matches) {
            (0, response_1.sendError)(res, 'Current password is incorrect', 400);
            return;
        }
        // Don't let a user "change" to the same password.
        if (matches && (await bcryptjs_1.default.compare(newPassword, user.passwordHash))) {
            (0, response_1.sendError)(res, 'New password must be different from the current one', 400);
            return;
        }
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await user.save();
        (0, response_1.sendSuccess)(res, { message: 'Password updated successfully' });
    }
    catch (err) {
        console.error('changePassword error:', err);
        (0, response_1.sendError)(res, 'Failed to update password', 500);
    }
}
//# sourceMappingURL=user.controller.js.map