# Keyboard Shortcut PDF Storage

The admin upload feature stores file metadata in MongoDB and the PDF bytes on private filesystem storage. Files are not served by the existing public `/uploads` static route; public PDFs are streamed by the API only while their database record is published. Drafts are available to signed-in admins through protected preview endpoints only.

## Production storage requirement

Do not use an ephemeral application filesystem for these files. On the production host, attach a persistent disk to the API service and set:

```env
KEYBOARD_SHORTCUTS_STORAGE_DIR=/var/data/typeoye-keyboard-shortcuts
KEYBOARD_SHORTCUT_PDF_MAX_BYTES=20971520
```

`KEYBOARD_SHORTCUTS_STORAGE_DIR` must point inside the persistent disk mount. Uploads return a storage configuration error in production when it is not set. The default maximum is 20 MiB; the server permits a configured value from 1 KiB to 100 MiB. If you change the limit, keep the client limit in `client/src/data/resources/keyboardShortcuts.ts` in sync.

For local development, files are stored outside the public `/uploads` tree under `server/private-uploads/keyboard-shortcuts/` by default. Back up the persistent disk alongside MongoDB metadata. Do not manually copy uploaded files to `client/public`.

## Admin workflow

Open Admin Panel → **Keyboard Shortcuts PDFs**. Uploading always creates a draft first. Preview, edit metadata, publish/unpublish, replace, or delete guides from the management table. The application name is free text; add suggestions in the admin page as desired. To add a category, extend the category list in `server/src/models/KeyboardShortcutPdf.ts` and the matching frontend list in `client/src/data/resources/keyboardShortcuts.ts`.
