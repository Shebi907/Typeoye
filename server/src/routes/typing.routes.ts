import { Router } from 'express';
import {
  submitSession,
  getResults,
  getResult,
  getRandomParagraph,
  sessionSchema,
} from '../controllers/typing.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.get('/paragraphs/random', getRandomParagraph);
router.post('/sessions', authenticate, validate(sessionSchema), submitSession);
router.get('/results', authenticate, getResults);
router.get('/results/:id', authenticate, getResult);

export default router;
