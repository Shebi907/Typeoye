import { Router } from 'express';
import { submitContact, contactSchema } from '../controllers/contact.controller';
import { validate } from '../middleware/validate.middleware';
import { contactLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/messages', contactLimiter, validate(contactSchema), submitContact);

export default router;
