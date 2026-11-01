import path from 'path';
import { UPLOADS_DIR } from './uploads';
import { env } from './env';

/**
 * PDFs are deliberately stored outside /uploads, which is publicly static.
 * Production must configure a persistent mount before PDF uploads are enabled.
 */
export function keyboardShortcutStorageDir(): string | null {
  if (env.KEYBOARD_SHORTCUTS_STORAGE_DIR) return path.resolve(env.KEYBOARD_SHORTCUTS_STORAGE_DIR);
  if (env.NODE_ENV === 'production') return null;
  return path.resolve(UPLOADS_DIR, '..', 'private-uploads', 'keyboard-shortcuts');
}

export function keyboardShortcutMaxBytes(): number {
  return env.KEYBOARD_SHORTCUT_PDF_MAX_BYTES;
}
