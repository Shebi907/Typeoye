import { Router } from 'express';
import { completeGame, getGameHistory, gameSchema } from '../controllers/games.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.get('/history', authenticate, getGameHistory);
router.post('/complete', optionalAuthenticate, validate(gameSchema), completeGame);

export default router;