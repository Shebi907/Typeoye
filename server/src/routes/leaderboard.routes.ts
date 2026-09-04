import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Read-only for everyone, including guests. Personal rank ("me") is only
// included when a valid token is present (optional auth).
router.get('/', optionalAuthenticate, getLeaderboard);

export default router;