import { Router } from 'express';
import { z } from 'zod';
import {
  getProfile,
  updateSettings,
  getAchievements,
  updateAvatar,
  removeAvatar,
  changePassword,
  updateSettingsSchema,
  changePasswordSchema,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { changePasswordLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

const avatarSchema = z.object({ dataUrl: z.string().min(1, 'Image data is required') });

router.get('/:id/profile', getProfile);
router.patch('/settings', authenticate, validate(updateSettingsSchema), updateSettings);
router.get('/me/achievements', authenticate, getAchievements);
router.post('/me/avatar', authenticate, validate(avatarSchema), updateAvatar);
router.delete('/me/avatar', authenticate, removeAvatar);
router.post('/me/password', authenticate, changePasswordLimiter, validate(changePasswordSchema), changePassword);

export default router;