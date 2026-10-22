import { Router } from 'express';
import {
  getWpmTrend,
  getAccuracyTrend,
  getWeakKeys,
  getSummary,
  getHistory,
  getDashboardData,
  getProgress,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { pinLanguage } from '../middleware/language.middleware';

const router = Router();

router.get('/wpm-trend', authenticate, getWpmTrend);
router.get('/accuracy-trend', authenticate, getAccuracyTrend);
router.get('/weak-keys', authenticate, getWeakKeys);
router.get('/summary', authenticate, getSummary);
router.get('/dashboard', authenticate, getDashboardData);
router.get('/history', authenticate, getHistory);
// English progress (default course).
router.get('/progress', authenticate, getProgress);
// Urdu progress — same handler, language pinned so every query is scoped to the
// Urdu course and never reads English data.
router.get('/progress/urdu', authenticate, pinLanguage('ur'), getProgress);

export default router;
