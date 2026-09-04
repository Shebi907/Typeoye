import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import User from '../models/User';
import Profile from '../models/Profile';
import Settings from '../models/Settings';
import UserProgress from '../models/UserProgress';
import Streak from '../models/Streak';
import { signToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { syncProfileLevel } from '../services/gamification.service';
import { sendEmail } from '../services/emailService';
import { env } from '../config/env';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/** Helper to generate cryptographic token and hash for storage */
function createVerificationToken() {
  const unhashedToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(unhashedToken).digest('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { unhashedToken, hashedToken, expires };
}

async function sendVerificationEmail(email: string, rawToken: string): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || env.CLIENT_URL || 'http://localhost:5173';
  const verifyUrl = `${clientUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: email,
    subject: 'Verify your email address for Typeoye',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #17171F;">
        <h2 style="color: #4361EE;">Welcome to Typeoye!</h2>
        <p>Thank you for signing up. Please verify your email address to activate your account and start your typing journey.</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4361EE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 13px; color: #666;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 13px; color: #4361EE; word-break: break-all;">${verifyUrl}</p>
        <p style="font-size: 12px; color: #999; margin-top: 40px;">This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body as z.infer<typeof registerSchema>;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'Email' : 'Username';
      sendError(res, `${field} is already taken`, 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash,
      emailVerified: true,
    });

    // Create companion documents idempotently
    const [profile, settings] = await Promise.all([
      Profile.findOneAndUpdate({ userId: user._id }, { $setOnInsert: { displayName: username } }, { new: true, upsert: true }),
      Settings.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
      UserProgress.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
      Streak.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
    ]);

    const synced = await syncProfileLevel(user._id);
    const token = signToken(user._id.toString());

    sendSuccess(
      res,
      {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          emailVerified: true,
          createdAt: user.createdAt,
        },
        profile: synced ?? profile,
        settings,
      },
      201
    );
  } catch (err) {
    console.error(`[auth] REGISTER FAILED for "${req.body?.username ?? req.body?.email}" from ${req.ip}:`, err);
    sendError(res, 'Registration failed. Please try again.', 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    // Self-heal companion documents
    const [profile, settings] = await Promise.all([
      Profile.findOneAndUpdate({ userId: user._id }, { $setOnInsert: { displayName: user.username } }, { new: true, upsert: true }),
      Settings.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
    ]);

    const synced = await syncProfileLevel(user._id);
    const token = signToken(user._id.toString());

    sendSuccess(res, {
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified ?? true,
        createdAt: user.createdAt,
      },
      profile: synced ?? profile,
      settings,
    });
  } catch (err) {
    console.error(`[auth] LOGIN FAILED for "${req.body?.email}" from ${req.ip}:`, err);
    sendError(res, 'Login failed. Please try again.', 500);
  }
}

export async function verifyEmail(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {
    message: 'Email verification is no longer required. You can log in directly.',
  });
}

export async function resendVerification(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {
    message: 'Email verification is no longer required. You can log in directly.',
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;

    const [profile, settings] = await Promise.all([
      Profile.findOne({ userId: user._id }),
      Settings.findOne({ userId: user._id }),
    ]);

    const synced = await syncProfileLevel(user._id);

    sendSuccess(res, {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      profile: synced ?? profile,
      settings,
    });
  } catch (err) {
    console.error('Me error:', err);
    sendError(res, 'Failed to fetch user data', 500);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { message: 'Logged out successfully' });
}
