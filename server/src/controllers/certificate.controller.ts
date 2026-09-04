import { Request, Response } from 'express';
import { z } from 'zod';
import TypingSession from '../models/TypingSession';
import { computeStats } from '../services/wpm.service';
import {
  CERT_MIN_ACCURACY,
  CERT_MIN_WPM,
  getCertificateDuration,
  newCertificateCode,
  renderCertificatePdf,
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
 * One-shot guest certificate generation. The raw keystroke data is verified
 * here — stats are recomputed from typedWords exactly like every other saved
 * session, and NOTHING is persisted (no user, no session record). The PDF is
 * streamed straight back to the browser.
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

    // Qualification gate: BOTH thresholds must be met by the same test, or the
    // certificate is NOT issued (the client cannot bypass this — the PDF is
    // only ever produced here, recomputed from the raw keystrokes).
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

    const pdf = await renderCertificatePdf({
      recipientName: body.recipientName.trim(),
      wpm,
      accuracy: stats.accuracy,
      durationSeconds,
      certificateId: newCertificateCode(),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(pdf.length));
    res.setHeader('Content-Disposition', 'attachment; filename="Typeoye-Certificate.pdf"');
    res.status(200).send(pdf);
  } catch (err) {
    console.error('generateGuestCertificate error:', err);
    sendError(res, 'Failed to generate certificate', 500);
  }
}
