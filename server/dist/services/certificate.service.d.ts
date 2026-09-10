export declare const CERT_DURATION_KEY = "certificate.durationSeconds";
export declare const DEFAULT_CERT_DURATION = 60;
export declare const CERT_MIN_WPM = 30;
export declare const CERT_MIN_ACCURACY = 90;
/** Admin-configurable certificate test duration (falls back to the default). */
export declare function getCertificateDuration(): Promise<number>;
export declare function newCertificateCode(): string;
/**
 * Deterministic certificate ID derived from the test end-time and recipient
 * name. This ensures the same test always produces the same certificate ID
 * regardless of how many times the PDF is regenerated (e.g. re-downloads).
 * The server generates this once at test completion and returns it as a
 * response header so the client can show it in the preview.
 */
export declare function certificateCodeFor(endTime: string, recipientName: string): string;
/** Format a Date/ISO string as "September 7, 2026" for the certificate. */
export declare function formatCertificateDate(d: Date | string): string;
/** Total characters actually typed (server-computed, never trusted from the client). */
export declare function computeKeystrokes(typedWords: Array<{
    typed: string;
}>): number;
/** Performance band derived from WPM. Only reachable for earned certificates. */
export declare function performanceLevel(wpm: number): string;
/** Whole-minute label for the selected test duration (60 → "1 Minute", 300 → "5 Minutes"). */
export declare function formatTestDuration(seconds: number): string;
/** Safe filename fragment derived from the recipient name. */
export declare function sanitizeCertificateFileName(name: string, fallback?: string): string;
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
    /** Public verification URL (rendered when the platform provides one). */
    verificationUrl?: string;
}
/** Render the official Typeoye certificate to a vector PDF buffer (A4 landscape). */
export declare function renderCertificatePdf(cert: CertificatePdfData): Promise<Buffer>;
//# sourceMappingURL=certificate.service.d.ts.map