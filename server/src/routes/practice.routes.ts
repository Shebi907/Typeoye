import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { generatePractice, getPracticeOverview } from '../controllers/practice.controller';

const router = Router();
// Word generation is open so guests can practice; overview uses the
// authenticated user's weak-key profile and recent results. Optional auth on
// generate lets signed-in users keep their weak-key/set personalization.
router.get('/overview', authenticate, getPracticeOverview);
router.get('/generate', optionalAuthenticate, generatePractice);
export default router;