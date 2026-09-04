import { Router } from 'express';
import {
  register,
  login,
  me,
  logout,
  verifyEmail,
  resendVerification,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../controllers/auth.controller';
import { googleOAuthStart, googleOAuthCallback } from '../controllers/googleAuth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { verificationLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/me', authenticate, me);
router.post('/logout', logout);

// Google OAuth — "Continue with Google"
router.get('/google', googleOAuthStart);
router.get('/google/callback', googleOAuthCallback);

export default router;
