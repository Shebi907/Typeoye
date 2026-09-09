import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';

export const authLimiter = rateLimit({
  // Generous limit so genuine users and manual testing (repeated signups/logins)
  // never hit a wall. Still abuse-safe — requests are blocked past the cap.
  windowMs: isProduction ? 5 * 60 * 1000 : 60 * 1000,
  max: isProduction ? 120 : 300,
  message: { success: false, error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: { success: false, error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const certificateLimiter = rateLimit({
  // PDF generation is CPU-bound; keep it tight per IP.
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many certificates generated. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const changePasswordLimiter = rateLimit({
  // Prevent automated brute-force against the change-password endpoint while
  // staying generous enough that a user re-entering their password a few times
  // is never blocked.
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many password change attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const contactLimiter = rateLimit({
  // Spam control for the public contact form (sends real email) — 3 per IP per
  // 10 minutes so a single user can still troubleshoot a few submissions.
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { success: false, error: 'Too many messages sent. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const verificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { success: false, error: 'Too many verification requests. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many recovery attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});