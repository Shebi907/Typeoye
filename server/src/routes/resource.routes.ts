import { Router } from 'express';
import { keyboardShortcutPublic } from '../controllers/keyboardShortcutPdf.controller';

const router = Router();

router.get('/keyboard-shortcuts', keyboardShortcutPublic.list);
router.get('/keyboard-shortcuts/:slug/pdf', keyboardShortcutPublic.pdf);
router.get('/keyboard-shortcuts/:slug', keyboardShortcutPublic.get);

export default router;
