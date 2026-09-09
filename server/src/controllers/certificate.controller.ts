import { Request, Response } from 'express';
import { z } from 'zod';
import TypingSession from '../models/TypingSession';
import { computeStats } from '../services/wpm.service';
import {
  CERT_MIN_ACCURACY,
  CERT_MIN_WPM,
  certificateCodeFor,
  computeKeystrokes,
  formatCertificateDate,
  formatTestDuration,
  getCertificateDuration,
  performanceLevel,
  renderCertificatePdf,
  sanitizeCertificateFileName,
} from '../services/certificate.service';
import { sendSuccess, sendError } from '../utils/response';

/**
 * Public config so the client knows how long a certificate test runs
 * (admins can change it in Settings without a deploy).
 */
export async function getCertificateConfig(_req: Request, res: Response): Promise<void> {
  try {
    const durationSeconds = await getCertificateDuration();
    sendSuccess(res, { durationSeconds });
  } catch (err) {
    console.error('getCertificateConfig error:', err);
    sendError(res, 'Failed to load certificate configuration', 500);
  }
}

/**
 * One-shot guest certificate validation + PDF generation. The raw keystroke
 * data is verified here — stats are recomputed from typedWords exactly like
 * every other saved session, and NOTHING is persisted (no user, no session
 * record). The response streams back the official vector PDF certificate
 * (real .pdf, A4 landscape design) and the browser saves it as
 * `Typeoye-Typing-Certificate-<name>.pdf`.
 *
 * Response headers carry the deterministic certificate metadata.
 */
export const guestCertificateSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  recipientName: z.string().trim().min(1).max(60),
  typedWords: z
    .array(
      z.object({
        word: z.string(),
        typed: z.string(),
        correct: z.boolean(),
        timeTakenMs: z.number().min(0),
      })
    )
    .min(1),
});

export async function generateGuestCertificate(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as z.infer<typeof guestCertificateSchema>;

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    if (durationSeconds <= 0 || durationSeconds > 3600) {
      sendError(res, 'Invalid session duration', 400);
      return;
    }

    // Server-side verification: stats always come from the raw word data.
    const stats = computeStats(body.typedWords, durationSeconds);
    if (!stats.attemptedWords) {
      sendError(res, 'No typing data found in this attempt', 400);
      return;
    }

    // Qualification gate: BOTH thresholds must be met by the same test.
    const wpm = Math.round(stats.wpm * 10) / 10;
    const earned = wpm >= CERT_MIN_WPM && stats.accuracy >= CERT_MIN_ACCURACY;
    if (!earned) {
      sendError(
        res,
        `Certificate not earned — you need at least ${CERT_MIN_WPM} WPM and ${CERT_MIN_ACCURACY}% accuracy in a single test (got ${wpm} WPM and ${stats.accuracy}% accuracy).`,
        400
      );
      return;
    }

    // Deterministic ID: same test+name always produces the same cert ID.
    const certificateId = certificateCodeFor(body.endTime, body.recipientName.trim());
    const keystrokes = computeKeystrokes(body.typedWords);
    const perf = performanceLevel(wpm);

    const cert = {
      recipientName: body.recipientName.trim(),
      wpm,
      accuracy: stats.accuracy,
      keystrokes,
      performance: perf,
      durationSeconds,
      certificateId,
      completionDate: endTime.toISOString(),
    };

    // Return certificate metadata in headers.
    const testDate = formatCertificateDate(endTime);
    res.setHeader('X-Certificate-Id', certificateId);
    res.setHeader('X-Certificate-Wpm', String(cert.wpm));
    res.setHeader('X-Certificate-Accuracy', String(cert.accuracy));
    res.setHeader('X-Certificate-Keystrokes', String(keystrokes));
    res.setHeader('X-Certificate-Performance', perf);
    res.setHeader('X-Certificate-Date', testDate);
    res.setHeader('X-Certificate-Duration', formatTestDuration(durationSeconds));

    // Render the official certificate as a vector PDF and stream it down.
    const pdf = await renderCertificatePdf(cert);
    const filename = `Typeoye-Typing-Certificate-${sanitizeCertificateFileName(cert.recipientName)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.status(200);
    res.end(pdf);
  } catch (err) {
    console.error('generateGuestCertificate error:', err);
    sendError(res, 'Failed to generate certificate', 500);
  }
}
