import { Router } from 'express';
import { getLessons, getLesson, completeExercise, completeExerciseSchema } from '../controllers/lesson.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
// Course content is public (guests can browse lessons); only saving an
// exercise completion requires an account. Optional auth keeps progress
// unlocked/status computed from the signed-in user when a token is present.
router.get('/', optionalAuthenticate, getLessons);
router.get('/:id', optionalAuthenticate, getLesson);
router.post('/:id/exercises/:exerciseId/complete', authenticate, validate(completeExerciseSchema), completeExercise);
export default router;