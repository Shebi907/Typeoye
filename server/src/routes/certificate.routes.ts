import { Router } from 'express';
import {
  getCertificateConfig,
  generateGuestCertificate,
  guestCertificateSchema,
} from '../controllers/certificate.controller';
import { validate } from '../middleware/validate.middleware';
import { certificateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public — no sign-in required anywhere in the certificate flow.
router.get('/config', getCertificateConfig);
router.post('/guest', certificateLimiter, validate(guestCertificateSchema), generateGuestCertificate);

export default router;
