import { Router } from 'express';
import { getLessons, getLesson, completeExercise, completeExerciseSchema } from '../controllers/lesson.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { pinLanguage } from '../middleware/language.middleware';

const router = Router();
// Urdu course. Same controller/models as the English course, but every query is
// scoped to language 'ur' via pinLanguage, so the two courses — and their
// progress, unlocking and content — never touch each other.
router.use(pinLanguage('ur'));
router.get('/', optionalAuthenticate, getLessons);
router.get('/:id', optionalAuthenticate, getLesson);
router.post('/:id/exercises/:exerciseId/complete', authenticate, validate(completeExerciseSchema), completeExercise);
export default router;
