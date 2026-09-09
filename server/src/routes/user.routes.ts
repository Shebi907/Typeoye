import { Router } from 'express';
import { z } from 'zod';
import {
  getProfile,
  getMyProfile,
  updateSettings,
  getAchievements,
  updateAvatar,
  removeAvatar,
  changePassword,
  setPassword,
  getSecurityQuestionStatus,
  setSecurityQuestion,
  updateSettingsSchema,
  changePasswordSchema,
  setPasswordSchema,
  setSecurityQuestionSchema,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { changePasswordLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

const avatarSchema = z.object({ dataUrl: z.string().min(1, 'Image data is required') });

router.get('/me/profile', authenticate, getMyProfile);
router.get('/:id/profile', getProfile);
router.patch('/settings', authenticate, validate(updateSettingsSchema), updateSettings);
router.get('/me/achievements', authenticate, getAchievements);
router.post('/me/avatar', authenticate, validate(avatarSchema), updateAvatar);
router.delete('/me/avatar', authenticate, removeAvatar);
router.post('/me/password', authenticate, changePasswordLimiter, validate(changePasswordSchema), changePassword);
router.post('/me/set-password', authenticate, changePasswordLimiter, validate(setPasswordSchema), setPassword);
router.get('/me/security-question-status', authenticate, getSecurityQuestionStatus);
router.post('/me/security-question', authenticate, changePasswordLimiter, validate(setSecurityQuestionSchema), setSecurityQuestion);

export default router;