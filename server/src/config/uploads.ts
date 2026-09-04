import fs from 'fs';
import path from 'path';

/** Root folder for user-uploaded files, resolved from the server process cwd. */
export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

/** Create upload folders (idempotent) before the app starts serving them. */
export function ensureUploadDirs(): void {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}