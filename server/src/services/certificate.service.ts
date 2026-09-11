import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import PlatformSetting from '../models/PlatformSetting';

export const CERT_DURATION_KEY = 'certificate.durationSeconds';
export const DEFAULT_CERT_DURATION = 60;
export const CERT_MIN_WPM = 30;
export const CERT_MIN_ACCURACY = 90;
const CERT_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Admin-configurable certificate test duration (falls back to the default). */
export async function getCertificateDuration(): Promise<number> {
  const row = await PlatformSetting.findOne({ key: CERT_DURATION_KEY }).lean();
  return typeof row?.value === 'number' && row.value >= 30 && row.value <= 900
    ? row.value
    : DEFAULT_CERT_DURATION;
}

export function newCertificateCode(): string {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) code += CERT_ALPHABET[bytes[i] % CERT_ALPHABET.length];
  return `CERT-${new Date().getFullYear()}-${code}`;
}

/**
 * Deterministic certificate ID derived from the test end-time and recipient
 * name. This ensures the same test always produces the same certificate ID
 * regardless of how many times the PDF is regenerated (e.g. re-downloads).
 * The server generates this once at test completion and returns it as a
 * response header so the client can show it in the preview.
 */
export function certificateCodeFor(endTime: string, recipientName: string): string {
  const date = new Date(endTime);
  const year = date.getFullYear();
  const seed = `CERT-${year}-${endTime}-${recipientName.toLowerCase().trim()}`;
  const hash = crypto.createHash('sha256').update(seed).digest();
  let code = '';
  for (let i = 0; i < 6; i++) code += CERT_ALPHABET[hash[i] % CERT_ALPHABET.length];
  return `CERT-${year}-${code}`;
}

/** Format a Date/ISO string as "September 7, 2026" for the certificate. */
export function formatCertificateDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Total characters actually typed (server-computed, never trusted from the client). */
export function computeKeystrokes(typedWords: Array<{ typed: string }>): number {
  return typedWords.reduce((acc, w) => acc + w.typed.length, 0);
}

/** Performance band derived from WPM. Only reachable for earned certificates. */
export function performanceLevel(wpm: number): string {
  if (wpm >= 90) return 'OUTSTANDING';
  if (wpm >= 70) return 'EXCELLENT';
  if (wpm >= 50) return 'PROFICIENT';
  return 'COMPETENT';
}

/** Whole-minute label for the selected test duration (60 → "1 Minute", 300 → "5 Minutes"). */
export function formatTestDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  return mins === 1 ? '1 Minute' : `${mins} Minutes`;
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

// ── Fonts (optional bundled TTFs; fall back to built-ins) ────────────────────

const FONTS_DIR = path.resolve(__dirname, '../../assets/fonts');
const has = (file: string): boolean => fs.existsSync(path.join(FONTS_DIR, file));

// White Typeoye mark (transparent PNG) — used on the gradient header band.
const WHITE_LOGO_PATH = path.resolve(__dirname, '../../assets/typeoye-logo-transparent.png');
function readWhiteLogo(): Buffer | null {
  if (!fs.existsSync(WHITE_LOGO_PATH)) return null;
  try {
    return fs.readFileSync(WHITE_LOGO_PATH);
  } catch {
    return null;
  }
}

/** Parse PNG dimensions from the IHDR chunk (bytes 16..23, big-endian). */
function pngSize(buf: Buffer): { width: number; height: number } {
  const sig = buf.length >= 8 && buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG';
  if (!sig || buf.length < 24) return { width: 0, height: 0 };
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// ── Palette (Typeoye brand — blue, purple, light lavender surfaces) ───────────

const BLUE = '#2563EB';
const PURPLE = '#7C3AED';
const OYE = '#C7D2FE';
const INK = '#1F2937';
const BODY_TEXT = '#4B5563';
const MUTED = '#6B7280';
const GREEN = '#16A34A';
const PILL_BG = '#EDE9FE';
const PILL_TXT = '#6D28D9';
const BOX_BG = '#F5F3FF';
const BOX_DIV = '#DDD6FE';
const FOOT_DIV = '#E5E7EB';

// ── Drawing helpers ──────────────────────────────────────────────────────────

/** Five-point star — the small award icon inside the pill badge. */
function drawStar(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number, color: string): void {
  doc.save();
  doc.fillColor(color);
  doc.moveTo(cx, cy - r);
  for (let i = 0; i < 5; i++) {
    const aOut = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const aIn = aOut + Math.PI / 5;
    doc.lineTo(cx + r * Math.cos(aOut), cy + r * Math.sin(aOut));
    doc.lineTo(cx + r * 0.45 * Math.cos(aIn), cy + r * 0.45 * Math.sin(aIn));
  }
  doc.closePath().fill();
  doc.restore();
}

/** Rounded white checkmark — inside the footer gradient badge. */
function drawCheck(doc: PDFKit.PDFDocument, cx: number, cy: number, s: number): void {
  doc.save();
  doc.lineWidth(2.1).lineCap('round').lineJoin('round').strokeColor('#FFFFFF');
  doc.moveTo(cx - s * 0.45, cy - 0.5)
    .lineTo(cx - s * 0.1, cy + s * 0.32)
    .lineTo(cx + s * 0.48, cy - s * 0.35)
    .stroke();
  doc.restore();
}

/** Sparse ring of translucent dots — subtle header texture. */
function drawDotRing(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number, count: number): void {
  doc.save();
  doc.fillOpacity(0.13).fillColor('#FFFFFF');
  for (let i = 0; i < count; i++) {
    const a = (i / count) * 2 * Math.PI;
    doc.circle(cx + r * Math.cos(a), cy + r * Math.sin(a), 2).fill();
  }
  doc.restore();
}

// ── Certificate data ─────────────────────────────────────────────────────────

export interface CertificatePdfData {
  recipientName: string;
  wpm: number;
  accuracy: number;
  keystrokes: number;
  performance: string;
  durationSeconds: number;
  certificateId: string;
  /** ISO date of test completion; defaults to "now" when omitted. */
  completionDate?: string;
  /** Public verification URL (reserved; not rendered in the card layout). */
  verificationUrl?: string;
}

/**
 * Render the official Typeoye certificate to a vector PDF buffer.
 *
 * The output is a single-page "certificate card" document sized to the design:
 * gradient header band (logo + wordmark), achievement pill, recipient name,
 * 3-column stats box (WPM / Accuracy / Duration) and a footer row (issue date,
 * gradient checkmark badge, certificate ID).
 */
export async function renderCertificatePdf(cert: CertificatePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Card dimensions in PDF points (1px @96dpi = 0.75pt).
    const W = 510; // 680px
    const H = 392;
    const doc = new PDFDocument({
      size: [W, H],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `Typeoye Typing Certificate ${cert.certificateId}`,
        Author: 'Typeoye',
        Subject: 'Typing Proficiency Certificate',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const cx = W / 2;

    // Optional bundled serif font for the recipient name.
    let serifFont = 'Helvetica';
    if (has('PlayfairDisplay-Italic.ttf')) {
      doc.registerFont('cert-serif', path.join(FONTS_DIR, 'PlayfairDisplay-Italic.ttf'));
      serifFont = 'cert-serif';
    }

    // ── Header band: blue → purple gradient, logo + wordmark ───────────────
    const headerH = 76;
    const headerGrad = doc.linearGradient(0, 0, W, headerH);
    headerGrad.stop(0, BLUE).stop(1, PURPLE);
    doc.rect(0, 0, W, headerH).fill(headerGrad);

    // Subtle decorative dot rings in the header corners (white, low opacity)
    drawDotRing(doc, W - 42, 18, 17, 8);
    drawDotRing(doc, 44, 58, 13, 6);

    // Centered lockup: white logo icon + "Typeoye" (with "oye" in periwinkle)
    const logo = readWhiteLogo();
    const headerCenterY = headerH / 2;
    if (logo) {
      const dims = pngSize(logo);
      const s = dims.width > 0 && dims.height > 0 ? dims.width / dims.height : 1;
      const logoH = 26;
      const logoW = logoH * s;

      doc.font('Helvetica-Bold').fontSize(19);
      const tW = doc.widthOfString('Type');
      const oW = doc.widthOfString('oye');
      const gap = 8;
      const totalW = logoW + gap + tW + oW;
      const startX = cx - totalW / 2;
      const logoTop = headerCenterY - logoH / 2;
      const wordTop = headerCenterY - 6.5;

      doc.image(logo, startX, logoTop, { width: logoW, height: logoH });
      doc.fillColor('#FFFFFF').text('Type', startX + logoW + gap, wordTop, { characterSpacing: 0 });
      doc.fillColor(OYE).text('oye', startX + logoW + gap + tW, wordTop, { characterSpacing: 0 });
    }

    // ── Body ───────────────────────────────────────────────────────────────
    const bodyX = 44;
    const bodyW = W - bodyX * 2;
    doc.fillColor('#FFFFFF');

    // Achievement pill badge
    const pillText = 'CERTIFICATE OF ACHIEVEMENT';
    const pillY = 102;
    const pillH = 20;
    doc.font('Helvetica-Bold').fontSize(6.8);
    const pillTextW = doc.widthOfString(pillText, { characterSpacing: 1.4 });
    const starW = 8;
    const pillW = 9 + starW + 5 + pillTextW + 12;
    const pillX = cx - pillW / 2;
    doc.fillColor(PILL_BG);
    doc.roundedRect(pillX, pillY, pillW, pillH, pillH / 2).fill();
    drawStar(doc, pillX + 9 + starW / 2, pillY + pillH / 2, 3.6, PILL_TXT);
    doc.font('Helvetica-Bold').fontSize(6.8).fillColor(PILL_TXT)
      .text(pillText, pillX + 9 + starW + 5, pillY + (pillH - 9) / 2, { characterSpacing: 1.4 });

    // Muted lead-in line
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED)
      .text('This certifies that', 0, 132, { width: W, align: 'center' });

    // Recipient name (serif, adaptive size)
    const nameText = cert.recipientName.trim();
    const nameFontSize = nameText.length > 20 ? 19 : nameText.length > 13 ? 22 : 25;
    doc.font(serifFont).fontSize(nameFontSize).fillColor(INK)
      .text(nameText, cx - 180, 146, { width: 360, align: 'center', height: 32 });

    // Gradient underline below the name
    const ulW = 52.5;
    const ulGrad = doc.linearGradient(cx - ulW / 2, 0, cx + ulW / 2, 0);
    ulGrad.stop(0, BLUE).stop(1, PURPLE);
    doc.roundedRect(cx - ulW / 2, 183, ulW, 2.25, 1.2).fill(ulGrad);

    // Statement sentence
    doc.font('Helvetica').fontSize(10.5).fillColor(BODY_TEXT)
      .text(
        'has successfully completed a Typeoye typing test,\ndemonstrating consistent speed and accuracy.',
        0, 197, { width: W, align: 'center', lineGap: 3 }
      );

    // ── Stats box: 3 equal columns (WPM / Accuracy / Duration) ─────────────
    const boxY = 240;
    const boxH = 64;
    doc.fillColor(BOX_BG);
    doc.roundedRect(bodyX, boxY, bodyW, boxH, 10).fill();
    doc.save();
    doc.lineWidth(0.8).strokeColor(BOX_DIV);
    for (let i = 1; i < 3; i++) {
      const dx = bodyX + (bodyW / 3) * i;
      doc.moveTo(dx, boxY + 12).lineTo(dx, boxY + boxH - 12).stroke();
    }
    doc.restore();

    const colW = bodyW / 3;
    const wpm = `${Math.round(cert.wpm)}`;
    const accuracy = `${Math.round(cert.accuracy * 10) / 10}%`;
    const duration = `${Math.max(1, Math.round(cert.durationSeconds / 60))} min`;
    const columns: Array<[string, string, string]> = [
      [wpm, 'WPM', BLUE],
      [accuracy, 'ACCURACY', GREEN],
      [duration, 'DURATION', INK],
    ];
    const valueY = boxY + 22;
    const labelY = boxY + 44;
    columns.forEach(([value, label, color], i) => {
      const colX = bodyX + colW * i;
      doc.font('Helvetica-Bold').fontSize(16).fillColor(color)
        .text(value, colX, valueY, { width: colW, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED)
        .text(label, colX, labelY, { width: colW, align: 'center', characterSpacing: 1.2 });
    });

    // ── Footer row: issue date | gradient checkmark | certificate ID ───────
    doc.save();
    doc.lineWidth(1).strokeColor(FOOT_DIV).dash(2, { space: 2.5 });
    doc.moveTo(bodyX, 322).lineTo(bodyX + bodyW, 322).stroke();
    doc.undash();
    doc.restore();

    // Left: issued-on date
    const issueDate = cert.completionDate
      ? formatCertificateDate(new Date(cert.completionDate))
      : formatCertificateDate(new Date());
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
      .text('ISSUED ON', bodyX, 332, { characterSpacing: 1 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK)
      .text(issueDate, bodyX, 347);

    // Center: circular gradient badge with a white checkmark
    const cy = 339;
    const cr = 13;
    const badgeGrad = doc.linearGradient(cx - cr, 0, cx + cr, 0);
    badgeGrad.stop(0, BLUE).stop(1, PURPLE);
    doc.circle(cx, cy, cr).fill(badgeGrad);
    drawCheck(doc, cx, cy, cr);

    // Right: certificate ID
    const rightW = 260;
    const rightX = bodyX + bodyW - rightW;
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
      .text('CERTIFICATE ID', rightX, 332, { width: rightW, align: 'right', characterSpacing: 1 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLUE)
      .text(cert.certificateId, rightX, 347, { width: rightW, align: 'right' });

    doc.end();
  });
}