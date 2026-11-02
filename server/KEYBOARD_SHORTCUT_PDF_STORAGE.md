# Keyboard Shortcut PDF Storage

The admin upload feature stores file metadata in MongoDB and the PDF bytes on private filesystem storage. Files are not served by the existing public `/uploads` static route; public PDFs are streamed by the API only while their database record is published. Drafts are available to signed-in admins through protected preview endpoints only.

## Production storage requirement

The repository identifies the deployed application as running on Render (`client/src/pages/Privacy.tsx`). Render supports persistent disks on paid web services; its default service filesystem is ephemeral, and Free web services cannot attach persistent disks. Do not use an ephemeral application filesystem for these files.

In the Render Dashboard, open the **backend API web service**, attach a disk on its **Disks** page, set its mount path to `/var/data`, and choose a size that fits the PDF library. The application directory below that mount is created automatically. Set these backend service environment variables:

```env
KEYBOARD_SHORTCUTS_STORAGE_DIR=/var/data/typeoye-keyboard-shortcuts
KEYBOARD_SHORTCUT_PDF_MAX_BYTES=20971520
```

`KEYBOARD_SHORTCUTS_STORAGE_DIR` must point inside the persistent disk mount. Uploads return a storage configuration error in production when it is not set. The backend creates the directory recursively and verifies it is a writable directory outside the public `/uploads` tree. The default maximum is 20 MiB; the server permits a configured value from 1 KiB to 100 MiB. If you change the limit, keep the client limit in `client/src/data/resources/keyboardShortcuts.ts` in sync.

If the frontend is deployed as a separate Render Static Site, set `VITE_API_URL` on that site to the backend's **public external URL** with `/api` appended (for example, `https://<backend-service>.onrender.com/api`). This Vite variable is baked in at build time, so changing it requires a frontend rebuild and deploy. Set the backend's `CLIENT_URL` to the public frontend origin so API CORS and PDF preview framing allow the site. The actual service hostname is only visible in the Render Dashboard and must not be guessed from this repository. If the frontend and API share one origin with a working `/api` proxy, the existing `/api` default is correct and `VITE_API_URL` can remain unset.

Render disk attachment and environment variables require a manual Dashboard change when the live services are not managed by a Blueprint. Saving the disk/environment changes triggers a backend deploy. Attaching a disk disables zero-downtime deploys and limits the service to one instance; account for that operational tradeoff before enabling horizontal scaling.

For local development, files are stored outside the public `/uploads` tree under `server/private-uploads/keyboard-shortcuts/` by default. Back up the persistent disk alongside MongoDB metadata. Do not manually copy uploaded files to `client/public`.

## Admin workflow

Open Admin Panel → **Keyboard Shortcuts PDFs**. Uploading always creates a draft first. Preview, edit metadata, publish/unpublish, replace, or delete guides from the management table. The application name is free text; add suggestions in the admin page as desired. To add a category, extend the category list in `server/src/models/KeyboardShortcutPdf.ts` and the matching frontend list in `client/src/data/resources/keyboardShortcuts.ts`.
