import { Router } from 'express';
import { getLessons, getLesson, completeExercise, completeExerciseSchema } from '../controllers/lesson.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { pinLanguage } from '../middleware/language.middleware';

const router = Router();
// English course. Course content is public (guests can browse lessons); only
// saving an exercise completion requires an account. Optional auth keeps
// progress unlocked/status computed from the signed-in user when a token is
// present. pinLanguage('en') scopes every query to the English course.
router.use(pinLanguage('en'));
router.get('/', optionalAuthenticate, getLessons);
router.get('/:id', optionalAuthenticate, getLesson);
router.post('/:id/exercises/:exerciseId/complete', authenticate, validate(completeExerciseSchema), completeExercise);
export default router;
