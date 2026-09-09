import { Router } from 'express';
import {
  getCertificateConfig,
  generateGuestCertificate,
  guestCertificateSchema,
} from '../controllers/certificate.controller';
import { getCertificateParagraph } from '../controllers/certificateParagraph.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { certificateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public — no sign-in required anywhere in the certificate flow.
router.get('/config', getCertificateConfig);
router.post('/guest', certificateLimiter, validate(guestCertificateSchema), generateGuestCertificate);

// Certificate-test content: signed-in visitors get persistent no-repeat
// selection, guests get client-side exclusion via `?exclude=`.
router.get('/paragraph', optionalAuthenticate, getCertificateParagraph);

export default router;
