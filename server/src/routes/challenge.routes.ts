import { Router } from 'express';
import {
  createChallengeHandler,
  getChallengeHandler,
  joinChallengeHandler,
  readyHandler,
  resultsHandler,
  rematchHandler,
  leaveHandler,
  createSchema,
  resultsSchema,
} from '../controllers/challenge.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.post('/', authenticate, validate(createSchema), createChallengeHandler);
router.get('/:code', authenticate, getChallengeHandler);
router.post('/:code/join', authenticate, joinChallengeHandler);
router.post('/:code/ready', authenticate, readyHandler);
router.post('/:code/results', authenticate, validate(resultsSchema), resultsHandler);
router.post('/:code/rematch', authenticate, rematchHandler);
router.post('/:code/leave', authenticate, leaveHandler);

export default router;