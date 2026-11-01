import api from './api';
import type { KeyboardShortcutPdf, KeyboardShortcutPdfInput } from '../data/resources/keyboardShortcuts';

const unwrap = <T,>(promise: Promise<{ data: { data: T } }>): Promise<T> => promise.then((response) => response.data.data);
const API_ROOT = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const publicShortcutPdfUrl = (slug: string, download = false) =>
  `${API_ROOT}/resources/keyboard-shortcuts/${encodeURIComponent(slug)}/pdf${download ? '?download=1' : ''}`;

export const listPublishedShortcutPdfs = () =>
  unwrap<{ items: KeyboardShortcutPdf[] }>(api.get('/resources/keyboard-shortcuts'));

export const getPublishedShortcutPdf = (slug: string) =>
  unwrap<{ item: KeyboardShortcutPdf }>(api.get(`/resources/keyboard-shortcuts/${encodeURIComponent(slug)}`));

export async function checkPublishedShortcutPdf(slug: string): Promise<boolean> {
  try {
    const response = await api.head(`/resources/keyboard-shortcuts/${encodeURIComponent(slug)}/pdf`);
    return response.status === 200 && String(response.headers['content-type'] ?? '').includes('application/pdf');
  } catch {
    return false;
  }
}

export const listAdminShortcutPdfs = () =>
  unwrap<{ items: KeyboardShortcutPdf[] }>(api.get('/admin/keyboard-shortcuts'));

export const uploadAdminShortcutPdf = (input: KeyboardShortcutPdfInput, file: File, onProgress?: (percent: number) => void) =>
  unwrap<{ item: KeyboardShortcutPdf }>(api.post('/admin/keyboard-shortcuts', file, {
    headers: {
      'Content-Type': 'application/pdf',
      'X-Shortcut-Metadata': btoa(unescape(encodeURIComponent(JSON.stringify(input)))),
      'X-Original-File-Name': encodeURIComponent(file.name),
    },
    onUploadProgress: (event) => onProgress?.(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
    timeout: 120000,
  }));

export const updateAdminShortcutPdf = (id: string, input: Partial<KeyboardShortcutPdfInput>) =>
  unwrap<{ item: KeyboardShortcutPdf }>(api.patch(`/admin/keyboard-shortcuts/${id}`, input));

export const setAdminShortcutPdfPublished = (id: string, published: boolean) =>
  unwrap<{ item: KeyboardShortcutPdf }>(api.patch(`/admin/keyboard-shortcuts/${id}/publish`, { published }));

export const replaceAdminShortcutPdf = (id: string, file: File, onProgress?: (percent: number) => void) =>
  unwrap<{ item: KeyboardShortcutPdf }>(api.put(`/admin/keyboard-shortcuts/${id}/file`, file, {
    headers: { 'Content-Type': 'application/pdf', 'X-Original-File-Name': encodeURIComponent(file.name) },
    onUploadProgress: (event) => onProgress?.(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
    timeout: 120000,
  }));

export const previewAdminShortcutPdf = (id: string) =>
  api.get<Blob>(`/admin/keyboard-shortcuts/${id}/preview`, { responseType: 'blob', timeout: 120000 }).then((response) => response.data);

export const deleteAdminShortcutPdf = (id: string) => api.delete(`/admin/keyboard-shortcuts/${id}`);
