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

const router = Router();

router.get('/wpm-trend', authenticate, getWpmTrend);
router.get('/accuracy-trend', authenticate, getAccuracyTrend);
router.get('/weak-keys', authenticate, getWeakKeys);
router.get('/summary', authenticate, getSummary);
router.get('/dashboard', authenticate, getDashboardData);
router.get('/history', authenticate, getHistory);
router.get('/progress', authenticate, getProgress);

export default router;
