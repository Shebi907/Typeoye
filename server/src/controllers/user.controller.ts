import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import User from '../models/User';
import Profile from '../models/Profile';
import Settings from '../models/Settings';
import { getUserAchievements } from '../services/achievement.service';
import { getProfileStats } from '../services/session.service';
import { syncProfileLevel } from '../services/gamification.service';
import { AVATARS_DIR } from '../config/uploads';
import { sendSuccess, sendError } from '../utils/response';

export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  font: z.enum(['jetbrains', 'fira', 'cascadia']).optional(),
  fontSize: z.number().min(12).max(32).optional(),
  soundEnabled: z.boolean().optional(),
  caretStyle: z.enum(['bar', 'block', 'underline']).optional(),
  testDuration: z.union([z.literal(60), z.literal(120), z.literal(300), z.literal(600), z.literal(900)]).optional(),
  wordCount: z.number().min(10).max(100).optional(),
  includeNumbers: z.boolean().optional(),
  includePunctuation: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const setPasswordSchema = z.object({
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const SECURITY_QUESTIONS = [
  'What is your favorite color?',
  'What is your favorite food?',
  'What was your childhood nickname?',
  "What was your first school's name?",
  'What is your favorite hobby?',
] as const;

export const setSecurityQuestionSchema = z.object({
  question: z.enum(SECURITY_QUESTIONS, { errorMap: () => ({ message: 'Please select a valid security question' }) }),
  answer: z.string().min(1, 'Security answer is required').max(100),
});

const AVATAR_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const EXT_MAP: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

/** Verify the decoded bytes actually match the declared image format (never
 *  trust the client's claimed MIME type alone — reject polyglot/renamed files
 *  that could be served as malicious content on the same origin). */
function matchesImageSignature(ext: string, buffer: Buffer): boolean {
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

/**
 * Shared profile payload used by both the public per-account profile endpoint
 * (viewing another user) and the authenticated own-profile endpoint. Stats are
 * always derived server-side for the given userId — never from a client-supplied
 * stat value.
 */
async function buildProfilePayload(userId: Parameters<typeof getProfileStats>[0]) {
  const [synced, profileProgress] = await Promise.all([
    syncProfileLevel(userId),
    getProfileStats(userId),
  ]);
  if (!synced) return null;
  return { profile: synced, progress: profileProgress };
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const payload = await buildProfilePayload(req.params.id);
    if (!payload) {
      sendError(res, 'Profile not found', 404);
      return;
    }
    sendSuccess(res, payload);
  } catch (err) {
    console.error('getProfile error:', err);
    sendError(res, 'Failed to fetch profile', 500);
  }
}

/** Authenticated own-profile: stats always belong to the JWT user, never to a
 *  userId taken from the URL/body/query. */
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const payload = await buildProfilePayload(req.user!._id);
    if (!payload) {
      sendError(res, 'Profile not found', 404);
      return;
    }
    sendSuccess(res, payload);
  } catch (err) {
    console.error('getMyProfile error:', err);
    sendError(res, 'Failed to fetch profile', 500);
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const updates = req.body as z.infer<typeof updateSettingsSchema>;

    const settings = await Settings.findOneAndUpdate(
      { userId: user._id },
      { $set: updates },
      { new: true, upsert: true }
    );

    sendSuccess(res, { settings });
  } catch (err) {
    console.error('updateSettings error:', err);
    sendError(res, 'Failed to update settings', 500);
  }
}

export async function getAchievements(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    // All active achievements with unlock status + live progress (server-derived)
    const achievements = await getUserAchievements(user._id);
    sendSuccess(res, { achievements });
  } catch (err) {
    console.error('getAchievements error:', err);
    sendError(res, 'Failed to fetch achievements', 500);
  }
}

/**
 * Store a user's profile picture. Accepts a base64 data URL (resized on the
 * client), writes it to /uploads/avatars and stores the URL on the Profile.
 */
export async function updateAvatar(req: Request, res: Response): Promise<void> {
  try {
    const dataUrl = (req.body as { dataUrl?: unknown })?.dataUrl;
    const match = typeof dataUrl === 'string' ? dataUrl.match(AVATAR_PATTERN) : null;
    if (!match) {
      sendError(res, 'Invalid image data', 400);
      return;
    }
    const mimeName = match[1] === 'jpg' ? 'jpeg' : match[1];
    const ext = EXT_MAP[`image/${mimeName}`];
    if (!ext) {
      sendError(res, 'Unsupported image format', 400);
      return;
    }

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > AVATAR_MAX_BYTES) {
      sendError(res, 'Image must be a valid file under 2 MB', 400);
      return;
    }
    if (!matchesImageSignature(ext, buffer)) {
      sendError(res, 'Image content does not match its file type', 400);
      return;
    }

    const profile = await Profile.findOne({ userId: req.user!._id });
    if (!profile) {
      sendError(res, 'Profile not found', 404);
      return;
    }

    // Remove the previous file if it is one of our avatars (never trust the path).
    const previous = profile.avatarUrl?.split('/').pop();
    if (previous) {
      const oldPath = path.join(AVATARS_DIR, previous);
      if (oldPath.startsWith(AVATARS_DIR)) {
        try { await fs.promises.unlink(oldPath); } catch { /* best-effort */ }
      }
    }

    await fs.promises.mkdir(AVATARS_DIR, { recursive: true });
    const filename = `${req.user!._id}-${Date.now()}.${ext}`;
    await fs.promises.writeFile(path.join(AVATARS_DIR, filename), buffer);

    profile.avatarUrl = `/uploads/avatars/${filename}`;
    await profile.save();

    sendSuccess(res, { profile: { ...profile.toObject(), level: profile.level, levelTitle: profile.levelTitle, totalXP: profile.totalXP }, ok: true });
  } catch (err) {
    console.error('updateAvatar error:', err);
    sendError(res, 'Failed to update profile picture', 500);
  }
}

/** Remove a user's profile picture and its stored file. */
export async function removeAvatar(req: Request, res: Response): Promise<void> {
  try {
    const profile = await Profile.findOne({ userId: req.user!._id });
    if (!profile) {
      sendError(res, 'Profile not found', 404);
      return;
    }
    const previous = profile.avatarUrl?.split('/').pop();
    if (previous) {
      const oldPath = path.join(AVATARS_DIR, previous);
      if (oldPath.startsWith(AVATARS_DIR)) {
        try { await fs.promises.unlink(oldPath); } catch { /* best-effort */ }
      }
    }
    profile.avatarUrl = undefined;
    await profile.save();
    sendSuccess(res, { profile: profile.toObject(), ok: true });
  } catch (err) {
    console.error('removeAvatar error:', err);
    sendError(res, 'Failed to remove profile picture', 500);
  }
}

/** Verify the current password and replace it with a newly hashed one. */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;

    const user = await User.findById(req.user!._id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    // Don't let a user "change" to the same password.
    if (matches && (await bcrypt.compare(newPassword, user.passwordHash))) {
      sendError(res, 'New password must be different from the current one', 400);
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    sendSuccess(res, { message: 'Password updated successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    sendError(res, 'Failed to update password', 500);
  }
}

/** First-time password for a Google-only account. Flips the provider to
 *  'local' so the user can then sign in with email + password too. */
export async function setPassword(req: Request, res: Response): Promise<void> {
  try {
    const { newPassword } = req.body as z.infer<typeof setPasswordSchema>;

    const user = await User.findById(req.user!._id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    if (user.authProvider !== 'google') {
      sendError(res, 'This account already has a password', 400);
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.authProvider = 'both';
    await user.save();

    sendSuccess(res, {
      message: 'Password set successfully. You can now sign in with your email address too.',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('setPassword error:', err);
    sendError(res, 'Failed to set password', 500);
  }
}

/** Returns whether the user has a security question configured (never the answer). */
export async function getSecurityQuestionStatus(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!._id);
    const configured = !!(user && user.securityQuestion && user.securityAnswerHash);
    sendSuccess(res, { configured });
  } catch (err) {
    console.error('getSecurityQuestionStatus error:', err);
    sendError(res, 'Failed to load security question status', 500);
  }
}

/** Set or update the user's security question (answer stored only as a bcrypt hash). */
export async function setSecurityQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { question, answer } = req.body as z.infer<typeof setSecurityQuestionSchema>;
    const user = await User.findById(req.user!._id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const securityAnswerHash = await bcrypt.hash(answer.toLowerCase().trim(), 12);
    user.securityQuestion = question;
    user.securityAnswerHash = securityAnswerHash;
    await user.save();

    sendSuccess(res, { message: 'Security question saved' });
  } catch (err) {
    console.error('setSecurityQuestion error:', err);
    sendError(res, 'Failed to save security question', 500);
  }
}
