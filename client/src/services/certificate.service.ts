import api, { getApiErrorMessage } from './api';
import type { CertificateParagraph, TypedWord } from '../types';

interface CertificateConfigResponse {
  durationSeconds: number;
}

export interface GuestCertificatePayload {
  startTime: string;
  endTime: string;
  recipientName: string;
  typedWords: TypedWord[];
}

/** Certificate metadata returned from the server via response headers. */
export interface CertificateMeta {
  certificateId: string;
  wpm: number;
  accuracy: number;
  keystrokes: number;
  performance: string;
  date: string;
  duration: string;
}

/** Safe filename fragment derived from the recipient name. */
export function sanitizeCertificateFileName(name: string, fallback = 'Certificate'): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (cleaned || fallback).slice(0, 48);
}

function defaultCertificateFileName(recipientName: string): string {
  return `Typeoye-Typing-Certificate-${sanitizeCertificateFileName(recipientName)}.pdf`;
}

/** Public config — how long a certificate test runs (admin-configurable). */
export async function getCertificateConfig(): Promise<number> {
  const { data } = await api.get('/certificates/config');
  const seconds = (data.data as CertificateConfigResponse).durationSeconds;
  return typeof seconds === 'number' && seconds >= 30 && seconds <= 900 ? seconds : 60;
}

/** Parse the server's JSON `{ error }` out of a blob (or bail). */
async function messageFromErrorData(blob: Blob): Promise<string | undefined> {
  if (typeof blob.text !== 'function') return undefined;
  try {
    const parsed = JSON.parse(await blob.text()) as { error?: string };
    return typeof parsed.error === 'string' && parsed.error ? parsed.error : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Submit the raw keystroke record for one-time server verification. Eligibility
 * (WPM + accuracy) is recomputed from the raw words server-side; the server
 * renders and streams back the official vector PDF certificate, and the browser
 * saves it as `Typeoye-Typing-Certificate-<name>.pdf`. Nothing is persisted.
 *
 * Returns the certificate metadata (from response headers) if available.
 */
export async function downloadGuestCertificate(payload: GuestCertificatePayload): Promise<CertificateMeta | null> {
  let blob: Blob;
  let disposition: string | undefined;
  let headerMap: Record<string, string> = {};
  try {
    const res = await api.post('/certificates/guest', payload, {
      timeout: 30000,
      responseType: 'blob',
    });
    blob = res.data as Blob;
    disposition = res.headers['content-disposition'] as string | undefined;
    headerMap = res.headers as unknown as Record<string, string>;
  } catch (err) {
    // With `responseType: 'blob'` the error body is also a blob — rethrow the
    // server's own message (e.g. "Certificate not earned — …") when available.
    const errorBlob = (err as { response?: { data?: Blob } }).response?.data as Blob | undefined;
    const message = errorBlob ? await messageFromErrorData(errorBlob) : undefined;
    if (message) throw new Error(message);
    throw new Error(getApiErrorMessage(err, 'Certificate could not be generated. Please try again.'));
  }

  // Belts and braces: an earned certificate must come back as a PDF.
  const contentType = (blob.type || '').toLowerCase();
  if (contentType && contentType !== 'application/pdf') {
    const message = await messageFromErrorData(blob);
    throw new Error(message || 'Certificate could not be generated. Please try again.');
  }

  const match = /filename="?([^";]+)"?/.exec(disposition ?? '');
  const fileName =
    match?.[1] && match[1].endsWith('.pdf')
      ? match[1]
      : defaultCertificateFileName(payload.recipientName);

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const h = headerMap;
  const head = (key: string): string | undefined => h[key] ?? h[key.toLowerCase()];
  const certificateId = head('x-certificate-id');
  if (!certificateId) return null;

  return {
    certificateId,
    wpm: Number(head('x-certificate-wpm') ?? 0),
    accuracy: Number(head('x-certificate-accuracy') ?? 0),
    keystrokes: Number(head('x-certificate-keystrokes') ?? 0),
    performance: head('x-certificate-performance') ?? '',
    date: head('x-certificate-date') ?? '',
    duration: head('x-certificate-duration') ?? '',
  };
}

export interface CertificateParagraphResponse {
  paragraph: CertificateParagraph;
  /** Server-side prior paragraph IDs (excluded even for guests). */
  exclude?: string[];
}

/**
 * Fetch the next certificate-test paragraph. Signed-in users get persistent,
 * non-repeating selection from the server; guests pass their own `exclude` list
 * (most-recent-first) so the browser enforces no-repeats without an account.
 */
export async function getCertificateParagraph(
  difficulty: 'easy' | 'medium' | 'hard',
  exclude: string[]
): Promise<CertificateParagraph> {
  const { data } = await api.get<{ data: CertificateParagraphResponse }>('/certificates/paragraph', {
    params: { difficulty, exclude: exclude.join(',') },
  });
  const body = data.data as CertificateParagraphResponse;
  if (!body?.paragraph?._id || !body.paragraph?.content) {
    throw new Error('No certificate paragraph available. Please try again.');
  }
  return body.paragraph;
}

/** Certificate-test difficulty maps onto the test difficulty keys. */
export const CERT_TO_PARAGRAPH_DIFFICULTY = { simple: 'easy', medium: 'medium', hard: 'hard' } as const;

const certHistoryKey = (testDifficulty: string): string => `typeoye.cert.history.${testDifficulty}`;
// Must be ≥ the pool size so a guest's used-list never drops an id while any
// fresh paragraphs remain (matches the server's HISTORY_LIMIT of 60).
const CERT_HISTORY_LIMIT = 60;

export function readCertHistory(testDifficulty: string): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(certHistoryKey(testDifficulty)) || '[]') as string[];
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeCertHistory(testDifficulty: string, ids: string[]): void {
  try {
    localStorage.setItem(certHistoryKey(testDifficulty), JSON.stringify(ids.slice(-CERT_HISTORY_LIMIT)));
  } catch {
    // storage unavailable — guests get local no-repeat best-effort only
  }
}

/**
 * Record a served paragraph id: move it to the end (most recent) and drop any
 * earlier copy. Keeping this list duplicate-free — with the newest id last — is
 * what lets a later `?exclude=` still know the *actually* last-served paragraph
 * after the pool cycles (a plain append would be deduped away).
 */
export function recordCertUsed(testDifficulty: string, id: string): void {
  try {
    const list = readCertHistory(testDifficulty).filter((existing) => existing !== id);
    list.push(id);
    writeCertHistory(testDifficulty, list);
  } catch {
    // storage unavailable — best-effort only
  }
}

/** Certificate links carry no difficulty picker — same session fallback as the test page. */
export function resolveCertificateDifficulty(): 'simple' | 'medium' | 'hard' {
  const stored = sessionStorage.getItem('typeoye_difficulty');
  return stored === 'medium' || stored === 'hard' ? stored : 'simple';
}

// Passage staged by the Certificate page (before navigation) so the test screen
// can render it on its very first paint — no blank/loading flash in between.
let preloadedCertificateParagraph: CertificateParagraph | null = null;

/** Peek at (don't consume) the passage prepared by the Certificate page. */
export function peekCertificateParagraphPreload(): CertificateParagraph | null {
  return preloadedCertificateParagraph;
}

/** Consume (and clear) the passage prepared by the Certificate page. */
export function takeCertificateParagraphPreload(): CertificateParagraph | null {
  const paragraph = preloadedCertificateParagraph;
  preloadedCertificateParagraph = null;
  return paragraph;
}

/**
 * Fetch and stage (in memory) the next certificate passage *before* the test
 * screen is shown, so the typing area never appears empty. Best-effort — any
 * failure leaves nothing staged and the test screen falls back to loading.
 */
export async function preloadCertificateParagraph(): Promise<void> {
  try {
    const testDifficulty = resolveCertificateDifficulty();
    const excluded = readCertHistory(testDifficulty);
    const paragraph = await getCertificateParagraph(CERT_TO_PARAGRAPH_DIFFICULTY[testDifficulty], excluded);
    preloadedCertificateParagraph = paragraph;
  } catch {
    preloadedCertificateParagraph = null;
  }
}