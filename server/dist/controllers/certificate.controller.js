"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestCertificateSchema = void 0;
exports.getCertificateConfig = getCertificateConfig;
exports.generateGuestCertificate = generateGuestCertificate;
const zod_1 = require("zod");
const wpm_service_1 = require("../services/wpm.service");
const certificate_service_1 = require("../services/certificate.service");
const response_1 = require("../utils/response");
/**
 * Public config so the client knows how long a certificate test runs
 * (admins can change it in Settings without a deploy).
 */
async function getCertificateConfig(_req, res) {
    try {
        const durationSeconds = await (0, certificate_service_1.getCertificateDuration)();
        (0, response_1.sendSuccess)(res, { durationSeconds });
    }
    catch (err) {
        console.error('getCertificateConfig error:', err);
        (0, response_1.sendError)(res, 'Failed to load certificate configuration', 500);
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
exports.guestCertificateSchema = zod_1.z.object({
    startTime: zod_1.z.string().datetime(),
    endTime: zod_1.z.string().datetime(),
    recipientName: zod_1.z.string().trim().min(1).max(60),
    typedWords: zod_1.z
        .array(zod_1.z.object({
        word: zod_1.z.string(),
        typed: zod_1.z.string(),
        correct: zod_1.z.boolean(),
        timeTakenMs: zod_1.z.number().min(0),
    }))
        .min(1),
});
async function generateGuestCertificate(req, res) {
    try {
        const body = req.body;
        const startTime = new Date(body.startTime);
        const endTime = new Date(body.endTime);
        const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
        if (durationSeconds <= 0 || durationSeconds > 3600) {
            (0, response_1.sendError)(res, 'Invalid session duration', 400);
            return;
        }
        // Server-side verification: stats always come from the raw word data.
        const stats = (0, wpm_service_1.computeStats)(body.typedWords, durationSeconds);
        if (!stats.attemptedWords) {
            (0, response_1.sendError)(res, 'No typing data found in this attempt', 400);
            return;
        }
        // Qualification gate: BOTH thresholds must be met by the same test.
        const wpm = Math.round(stats.wpm * 10) / 10;
        const earned = wpm >= certificate_service_1.CERT_MIN_WPM && stats.accuracy >= certificate_service_1.CERT_MIN_ACCURACY;
        if (!earned) {
            (0, response_1.sendError)(res, `Certificate not earned — you need at least ${certificate_service_1.CERT_MIN_WPM} WPM and ${certificate_service_1.CERT_MIN_ACCURACY}% accuracy in a single test (got ${wpm} WPM and ${stats.accuracy}% accuracy).`, 400);
            return;
        }
        // Deterministic ID: same test+name always produces the same cert ID.
        const certificateId = (0, certificate_service_1.certificateCodeFor)(body.endTime, body.recipientName.trim());
        const keystrokes = (0, certificate_service_1.computeKeystrokes)(body.typedWords);
        const perf = (0, certificate_service_1.performanceLevel)(wpm);
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
        const testDate = (0, certificate_service_1.formatCertificateDate)(endTime);
        res.setHeader('X-Certificate-Id', certificateId);
        res.setHeader('X-Certificate-Wpm', String(cert.wpm));
        res.setHeader('X-Certificate-Accuracy', String(cert.accuracy));
        res.setHeader('X-Certificate-Keystrokes', String(keystrokes));
        res.setHeader('X-Certificate-Performance', perf);
        res.setHeader('X-Certificate-Date', testDate);
        res.setHeader('X-Certificate-Duration', (0, certificate_service_1.formatTestDuration)(durationSeconds));
        // Render the official certificate as a vector PDF and stream it down.
        const pdf = await (0, certificate_service_1.renderCertificatePdf)(cert);
        const filename = `Typeoye-Typing-Certificate-${(0, certificate_service_1.sanitizeCertificateFileName)(cert.recipientName)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdf.length);
        res.status(200);
        res.end(pdf);
    }
    catch (err) {
        console.error('generateGuestCertificate error:', err);
        (0, response_1.sendError)(res, 'Failed to generate certificate', 500);
    }
}
//# sourceMappingURL=certificate.controller.js.map