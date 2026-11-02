import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { keyboardShortcutMaxBytes, keyboardShortcutStorageDir } from '../config/keyboardShortcuts';
import KeyboardShortcutPdf, { KEYBOARD_SHORTCUT_CATEGORIES, IKeyboardShortcutPdf } from '../models/KeyboardShortcutPdf';
import { sendError, sendSuccess } from '../utils/response';

const metadataSchema = z.object({
  applicationName: z.string().trim().min(2).max(120),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(5).max(600),
  category: z.enum(KEYBOARD_SHORTCUT_CATEGORIES),
  language: z.string().trim().min(2).max(60),
  version: z.string().trim().max(60).optional().default(''),
  source: z.string().trim().max(160).optional().default(''),
  pageCount: z.number().int().min(1).max(5000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
}).strict();
type PdfMetadata = z.infer<typeof metadataSchema>;

const editSchema = metadataSchema.partial();
const fileKeyPattern = /^[0-9a-f-]{36}\.pdf$/i;

function slugify(value: string): string {
  const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 170) || `shortcut-${Date.now()}`;
}

function safeOriginalName(input: string): string {
  let decoded = input;
  try { decoded = decodeURIComponent(input); } catch { /* keep the original header text */ }
  const base = path.posix.basename(decoded.replace(/\\/g, '/'));
  return base.replace(/[\u0000-\u001f\u007f"<>]/g, '').trim().slice(0, 180) || 'keyboard-shortcuts.pdf';
}

function parseTags(value: unknown): string[] | undefined {
  if (typeof value === 'string') return value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
  return Array.isArray(value) ? value : undefined;
}

function bodyBuffer(req: Request): Buffer | null {
  return Buffer.isBuffer(req.body) ? req.body : null;
}

function validatePdf(req: Request, buffer: Buffer): string | null {
  const originalName = safeOriginalName(String(req.headers['x-original-file-name'] ?? ''));
  if (!originalName.toLowerCase().endsWith('.pdf')) return 'The file name must end in .pdf.';
  const mime = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
  if (mime !== 'application/pdf') return 'Upload a PDF file.';
  if (buffer.length === 0) return 'The selected PDF is empty.';
  if (buffer.length > keyboardShortcutMaxBytes()) return `PDF must be ${Math.floor(keyboardShortcutMaxBytes() / (1024 * 1024))} MB or smaller.`;
  if (!buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) return 'The file does not have a valid PDF signature.';
  const tail = buffer.subarray(Math.max(0, buffer.length - 4096)).toString('latin1');
  if (!/startxref\s+\d+\s+%%EOF\s*$/.test(tail)) return 'The PDF appears incomplete or corrupted.';
  return null;
}

function pageCountFromPdf(buffer: Buffer): number | undefined {
  const pages = buffer.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length;
  return pages && pages > 0 ? pages : undefined;
}

function pdfPathFor(record: IKeyboardShortcutPdf): string | null {
  const dir = keyboardShortcutStorageDir();
  if (!dir || !fileKeyPattern.test(record.storedFileName)) return null;
  const file = path.resolve(dir, record.storedFileName);
  return file.startsWith(`${path.resolve(dir)}${path.sep}`) ? file : null;
}

function metadataDto(record: IKeyboardShortcutPdf, includeAdmin = false) {
  const common = {
    id: record._id.toString(),
    applicationName: record.applicationName,
    title: record.title,
    slug: record.slug,
    description: record.description,
    category: record.category,
    language: record.language,
    tags: record.tags,
    fileSize: record.fileSize,
    pageCount: record.pageCount ?? null,
    version: record.version ?? '',
    source: record.source ?? '',
    lastUpdated: record.lastUpdated?.toISOString().slice(0, 10) ?? '',
    uploadedAt: record.uploadedAt,
    updatedAt: record.updatedAt,
    published: record.published,
    publishedAt: record.publishedAt ?? null,
    pdfUrl: `/api/resources/keyboard-shortcuts/${encodeURIComponent(record.slug)}/pdf`,
  };
  if (!includeAdmin) return common;
  return {
    ...common,
    originalFileName: record.originalFileName,
    storedFileName: record.storedFileName,
    uploadedBy: record.uploadedBy.toString(),
  };
}

function metadataFromHeader(req: Request): z.SafeParseReturnType<unknown, PdfMetadata> {
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(String(req.headers['x-shortcut-metadata'] ?? ''), 'base64').toString('utf8'));
  } catch {
    return metadataSchema.safeParse(null);
  }
  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    input.tags = parseTags(input.tags);
    if (typeof input.pageCount === 'string' && input.pageCount.trim()) input.pageCount = Number(input.pageCount);
  }
  return metadataSchema.safeParse(value);
}

function handleDuplicate(err: unknown, res: Response): boolean {
  if ((err as { code?: number })?.code !== 11000) return false;
  sendError(res, 'A shortcut guide with a similar application and title already exists. Edit its details or use another title.', 409);
  return true;
}

async function ensureStorage(res: Response): Promise<string | null> {
  const dir = keyboardShortcutStorageDir();
  if (!dir) {
    sendError(res, 'Persistent PDF storage is not configured. Set KEYBOARD_SHORTCUTS_STORAGE_DIR to the deployed persistent disk mount.', 503);
    return null;
  }
  try {
    await fs.promises.mkdir(dir, { recursive: true });
    const [resolvedDir, resolvedUploadsDir, dirStat, dirInfo] = await Promise.all([
      fs.promises.realpath(dir),
      fs.promises.realpath(path.resolve(process.cwd(), 'uploads')),
      fs.promises.stat(dir),
      fs.promises.lstat(dir),
    ]);
    const uploadsRoot = `${resolvedUploadsDir}${path.sep}`;
    if (
      !dirStat.isDirectory() ||
      dirInfo.isSymbolicLink() ||
      resolvedDir === resolvedUploadsDir ||
      resolvedDir.startsWith(uploadsRoot)
    ) {
      sendError(res, 'PDF storage must be a real private directory outside the public uploads folder.', 503);
      return null;
    }
    await fs.promises.access(resolvedDir, fs.constants.R_OK | fs.constants.W_OK);
    return resolvedDir;
  } catch (err) {
    console.error('keyboard shortcut storage unavailable:', err);
    sendError(res, 'PDF storage is unavailable. Check the persistent storage configuration.', 503);
    return null;
  }
}

async function sendPdf(record: IKeyboardShortcutPdf, res: Response, download: boolean): Promise<void> {
  const file = pdfPathFor(record);
  if (!file) {
    sendError(res, 'PDF file is unavailable.', 404);
    return;
  }
  try {
    await fs.promises.access(file, fs.constants.R_OK);
  } catch {
    sendError(res, 'PDF file is unavailable.', 404);
    return;
  }
  const filename = download ? `Typeoye-${slugify(`${record.applicationName}-Keyboard-Shortcuts`)}.pdf` : safeOriginalName(record.originalFileName);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${env.CLIENT_URL}`);
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename.replace(/"/g, '')}"`);
  res.sendFile(file, (err) => {
    if (err && !res.headersSent) sendError(res, 'Failed to read the PDF file.', 500);
    else if (err) res.end();
  });
}

export const keyboardShortcutPublic = {
  list: async (_req: Request, res: Response): Promise<void> => {
    try {
      const records = await KeyboardShortcutPdf.find({ published: true }).sort({ applicationName: 1, title: 1 });
      const available = [];
      for (const record of records) {
        const file = pdfPathFor(record);
        if (!file) continue;
        try { await fs.promises.access(file, fs.constants.R_OK); available.push(metadataDto(record)); } catch { /* Hide missing files from public lists. */ }
      }
      sendSuccess(res, { items: available });
    } catch (err) {
      console.error('keyboardShortcutPublic.list error:', err);
      sendError(res, 'Failed to load keyboard shortcut guides.', 500);
    }
  },

  get: async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await KeyboardShortcutPdf.findOne({ slug: req.params['slug'], published: true });
      const file = record ? pdfPathFor(record) : null;
      if (!record || !file) { sendError(res, 'Published keyboard shortcut guide not found.', 404); return; }
      await fs.promises.access(file, fs.constants.R_OK);
      sendSuccess(res, { item: metadataDto(record) });
    } catch {
      sendError(res, 'Published keyboard shortcut guide not found.', 404);
    }
  },

  pdf: async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await KeyboardShortcutPdf.findOne({ slug: req.params['slug'], published: true });
      if (!record) { sendError(res, 'Published PDF not found.', 404); return; }
      await sendPdf(record, res, req.query['download'] === '1');
    } catch (err) {
      console.error('keyboardShortcutPublic.pdf error:', err);
      sendError(res, 'Failed to load the PDF.', 500);
    }
  },
};

export const adminKeyboardShortcutPdfs = {
  list: async (_req: Request, res: Response): Promise<void> => {
    try {
      const items = await KeyboardShortcutPdf.find().sort({ uploadedAt: -1 }).limit(500);
      sendSuccess(res, { items: items.map((item) => metadataDto(item, true)) });
    } catch (err) {
      console.error('adminKeyboardShortcutPdfs.list error:', err);
      sendError(res, 'Failed to load keyboard shortcut PDFs.', 500);
    }
  },

  upload: async (req: Request, res: Response): Promise<void> => {
    const buffer = bodyBuffer(req);
    if (!buffer) { sendError(res, 'Upload the PDF file as the request body.', 400); return; }
    const fileError = validatePdf(req, buffer);
    if (fileError) { sendError(res, fileError, 400); return; }
    const parsed = metadataFromHeader(req);
    if (!parsed.success) { sendError(res, parsed.error.issues[0]?.message ?? 'Check the guide details.', 400); return; }
    const dir = await ensureStorage(res);
    if (!dir) return;

    const metadata = parsed.data;
    const storedFileName = `${crypto.randomUUID()}.pdf`;
    const file = path.join(dir, storedFileName);
    const originalFileName = safeOriginalName(String(req.headers['x-original-file-name'] ?? 'keyboard-shortcuts.pdf'));
    try {
      await fs.promises.writeFile(file, buffer, { flag: 'wx', mode: 0o640 });
      const record = await KeyboardShortcutPdf.create({
        ...metadata,
        slug: slugify(`${metadata.applicationName}-${metadata.title}`),
        tags: metadata.tags,
        lastUpdated: metadata.lastUpdated ? new Date(`${metadata.lastUpdated}T00:00:00.000Z`) : undefined,
        filePath: storedFileName,
        storedFileName,
        originalFileName,
        fileSize: buffer.length,
        pageCount: metadata.pageCount ?? pageCountFromPdf(buffer),
        uploadedBy: req.user!._id,
        published: false,
        publishedAt: undefined,
      });
      sendSuccess(res, { item: metadataDto(record, true) }, 201);
    } catch (err) {
      try { await fs.promises.unlink(file); } catch { /* best-effort cleanup */ }
      if (handleDuplicate(err, res)) return;
      console.error('adminKeyboardShortcutPdfs.upload error:', err);
      sendError(res, 'Failed to save the PDF guide.', 500);
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const parsed = editSchema.safeParse(req.body);
    if (!parsed.success) { sendError(res, parsed.error.issues[0]?.message ?? 'Check the guide details.', 400); return; }
    try {
      const updates: Record<string, unknown> = { ...parsed.data };
      if (parsed.data.tags) updates.tags = parsed.data.tags;
      if (parsed.data.lastUpdated !== undefined) updates.lastUpdated = parsed.data.lastUpdated ? new Date(`${parsed.data.lastUpdated}T00:00:00.000Z`) : null;
      const item = await KeyboardShortcutPdf.findByIdAndUpdate(req.params['id'], updates, { new: true, runValidators: true });
      if (!item) { sendError(res, 'Keyboard shortcut PDF not found.', 404); return; }
      sendSuccess(res, { item: metadataDto(item, true) });
    } catch (err) {
      console.error('adminKeyboardShortcutPdfs.update error:', err);
      sendError(res, 'Failed to update the PDF details.', 500);
    }
  },

  setPublished: async (req: Request, res: Response): Promise<void> => {
    const published = req.body?.published;
    if (typeof published !== 'boolean') { sendError(res, 'Published must be true or false.', 400); return; }
    try {
      const item = await KeyboardShortcutPdf.findById(req.params['id']);
      if (!item) { sendError(res, 'Keyboard shortcut PDF not found.', 404); return; }
      if (published) {
        const file = pdfPathFor(item);
        if (!file) { sendError(res, 'Persistent PDF storage is not configured.', 503); return; }
        try { await fs.promises.access(file, fs.constants.R_OK); } catch { sendError(res, 'The uploaded PDF file is missing and cannot be published.', 409); return; }
      }
      item.published = published;
      item.publishedAt = published ? new Date() : undefined;
      await item.save();
      sendSuccess(res, { item: metadataDto(item, true) });
    } catch (err) {
      console.error('adminKeyboardShortcutPdfs.setPublished error:', err);
      sendError(res, 'Failed to change the publish status.', 500);
    }
  },

  replace: async (req: Request, res: Response): Promise<void> => {
    const buffer = bodyBuffer(req);
    if (!buffer) { sendError(res, 'Upload the replacement PDF as the request body.', 400); return; }
    const fileError = validatePdf(req, buffer);
    if (fileError) { sendError(res, fileError, 400); return; }
    const dir = await ensureStorage(res);
    if (!dir) return;
    let newPath: string | undefined;
    try {
      const item = await KeyboardShortcutPdf.findById(req.params['id']);
      if (!item) { sendError(res, 'Keyboard shortcut PDF not found.', 404); return; }
      const storedFileName = `${crypto.randomUUID()}.pdf`;
      newPath = path.join(dir, storedFileName);
      await fs.promises.writeFile(newPath, buffer, { flag: 'wx', mode: 0o640 });
      const oldPath = pdfPathFor(item);
      item.filePath = storedFileName;
      item.storedFileName = storedFileName;
      item.originalFileName = safeOriginalName(String(req.headers['x-original-file-name'] ?? item.originalFileName));
      item.fileSize = buffer.length;
      item.pageCount = pageCountFromPdf(buffer);
      await item.save();
      if (oldPath && oldPath !== newPath) { try { await fs.promises.unlink(oldPath); } catch { /* best-effort cleanup */ } }
      sendSuccess(res, { item: metadataDto(item, true) });
    } catch (err) {
      if (newPath) { try { await fs.promises.unlink(newPath); } catch { /* best-effort cleanup */ } }
      console.error('adminKeyboardShortcutPdfs.replace error:', err);
      sendError(res, 'Failed to replace the PDF file.', 500);
    }
  },

  preview: async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await KeyboardShortcutPdf.findById(req.params['id']);
      if (!item) { sendError(res, 'Keyboard shortcut PDF not found.', 404); return; }
      await sendPdf(item, res, false);
    } catch (err) {
      console.error('adminKeyboardShortcutPdfs.preview error:', err);
      sendError(res, 'Failed to load the PDF preview.', 500);
    }
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await KeyboardShortcutPdf.findByIdAndDelete(req.params['id']);
      if (!item) { sendError(res, 'Keyboard shortcut PDF not found.', 404); return; }
      const file = pdfPathFor(item);
      if (file) { try { await fs.promises.unlink(file); } catch { /* best-effort cleanup */ } }
      sendSuccess(res, { message: 'Keyboard shortcut PDF deleted.' });
    } catch (err) {
      console.error('adminKeyboardShortcutPdfs.remove error:', err);
      sendError(res, 'Failed to delete the PDF guide.', 500);
    }
  },
};
