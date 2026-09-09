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

export const SECURITY_QUESTIONS = [
  'What is your favorite color?',
  'What is your favorite food?',
  'What was your childhood nickname?',
  "What was your first school's name?",
  'What is your favorite hobby?',
] as const;

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  securityQuestion: z.enum(SECURITY_QUESTIONS, { errorMap: () => ({ message: 'Please select a valid security question' }) }),
  securityAnswer: z.string().min(1, 'Security answer is required').max(100),
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

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required').max(100),
});

export const verifySecurityAnswerSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required').max(100),
  answer: z.string().min(1, 'Answer is required').max(100),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Recovery token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
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
    const { username, email, password, securityQuestion, securityAnswer } = req.body as z.infer<typeof registerSchema>;
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
    const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 12);

    const user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash,
      emailVerified: true,
      securityQuestion,
      securityAnswerHash,
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
          authProvider: user.authProvider,
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

    // Google-only accounts have an unguessable password hash — reject them here
    // so the user gets actionable guidance instead of a generic failure.
    if (user.authProvider === 'google') {
      sendError(res, "This account was created with Google. Please use 'Continue with Google' to sign in.", 401);
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
        authProvider: user.authProvider,
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
        authProvider: user.authProvider,
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

/** Predefined security questions — no user-defined questions allowed. */

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');
  const query = isEmail
    ? { email: trimmed.toLowerCase() }
    : { username: trimmed };
  return User.findOne(query);
}

/** Step 1: Accept email/username. Unknown accounts are rejected explicitly so
 *  the user can try a different identifier; known accounts proceed to their
 *  security question. No recovery token is created here. */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { identifier } = req.body as z.infer<typeof forgotPasswordSchema>;
    const trimmed = identifier.trim();
    const user = await findUserByIdentifier(identifier);

    if (!user) {
      const message = trimmed.includes('@')
        ? 'This email address is not registered with Typeoye.'
        : 'This username is not registered with Typeoye.';
      sendError(res, message, 400);
      return;
    }

    if (user.recoveryLockedUntil && user.recoveryLockedUntil.getTime() > Date.now()) {
      sendError(res, 'Too many recovery attempts. Please try again later.', 429);
      return;
    }

    if (!user.securityQuestion || !user.securityAnswerHash) {
      sendError(res, 'This account has not set up a security question yet. You can set one up from your profile.', 400);
      return;
    }

    sendSuccess(res, {
      message: 'Account found. Answer your security question to continue.',
      securityQuestion: user.securityQuestion,
    });
  } catch (err) {
    console.error('[auth] FORGOT PASSWORD error:', err);
    sendError(res, 'Something went wrong. Please try again.', 500);
  }
}

/** Step 2: Verify the security answer and issue a short-lived recovery token. */
export async function verifySecurityAnswer(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, answer } = req.body as z.infer<typeof verifySecurityAnswerSchema>;
    const user = await findUserByIdentifier(identifier);

    if (!user || !user.securityAnswerHash) {
      sendError(res, 'Invalid answer. Please try again.', 400);
      return;
    }

    if (user.recoveryLockedUntil && user.recoveryLockedUntil.getTime() > Date.now()) {
      sendError(res, 'Too many recovery attempts. Please try again later.', 429);
      return;
    }

    const answerMatch = await bcrypt.compare(answer.toLowerCase().trim(), user.securityAnswerHash);

    if (!answerMatch) {
      const attempts = (user.recoveryFailedAttempts || 0) + 1;
      const update: Record<string, unknown> = { recoveryFailedAttempts: attempts };
      if (attempts >= 5) {
        update.recoveryLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      await User.updateOne({ _id: user._id }, { $set: update });
      sendError(res, 'Invalid answer. Please try again.', 400);
      return;
    }

    // Answer is correct — issue a single-use recovery token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          recoveryToken: hashedToken,
          recoveryTokenExpires: expires,
          recoveryFailedAttempts: 0,
          recoveryLockedUntil: null,
        },
      },
    );

    sendSuccess(res, { resetToken: rawToken });
  } catch (err) {
    console.error('[auth] VERIFY SECURITY ANSWER error:', err);
    sendError(res, 'Something went wrong. Please try again.', 500);
  }
}

/** Step 3: Exchange the recovery token for a new password. */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { resetToken, newPassword } = req.body as z.infer<typeof resetPasswordSchema>;
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      recoveryToken: hashedToken,
      recoveryTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      sendError(res, 'Invalid or expired recovery token. Please try again.', 400);
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.authProvider = user.authProvider === 'local' ? 'local' : 'both';
    user.recoveryToken = null;
    user.recoveryTokenExpires = null;
    user.recoveryFailedAttempts = 0;
    user.recoveryLockedUntil = null;
    await user.save();

    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (err) {
    console.error('[auth] RESET PASSWORD error:', err);
    sendError(res, 'Something went wrong. Please try again.', 500);
  }
}
