export type ShortcutCategory =
  | 'Microsoft Office'
  | 'Google Workspace'
  | 'Operating System'
  | 'Development Tools'
  | 'Other';

export interface KeyboardShortcutPdf {
  id: string;
  applicationName: string;
  title: string;
  slug: string;
  description: string;
  category: ShortcutCategory;
  language: string;
  tags: string[];
  fileSize: number;
  pageCount: number | null;
  version: string;
  source: string;
  lastUpdated: string;
  uploadedAt: string;
  updatedAt: string;
  published: boolean;
  publishedAt: string | null;
  pdfUrl: string;
  originalFileName?: string;
  storedFileName?: string;
  uploadedBy?: string;
}

export interface KeyboardShortcutPdfInput {
  applicationName: string;
  title: string;
  description: string;
  category: ShortcutCategory;
  language: string;
  version?: string;
  source?: string;
  pageCount?: number;
  tags?: string[];
  lastUpdated?: string;
}

export const KEYBOARD_SHORTCUT_PDF_CATEGORIES = [
  'All Applications',
  'Microsoft Office',
  'Google Workspace',
  'Operating System',
  'Development Tools',
  'Other',
] as const;

export const KEYBOARD_SHORTCUT_MAX_BYTES = 20 * 1024 * 1024;

export function formatPdfSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
