import { Router } from 'express';
import { getUrduContent } from '../controllers/urduContent.controller';

const router = Router();

// Public — every visitor (guest or signed in) may read published Urdu content.
router.get('/', getUrduContent);

export default router;
