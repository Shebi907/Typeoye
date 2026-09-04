export declare const CERT_DURATION_KEY = "certificate.durationSeconds";
export declare const DEFAULT_CERT_DURATION = 60;
export declare const CERT_MIN_WPM = 30;
export declare const CERT_MIN_ACCURACY = 90;
/** Admin-configurable certificate test duration (falls back to the default). */
export declare function getCertificateDuration(): Promise<number>;
export declare function newCertificateCode(): string;
export interface CertificatePdfData {
    recipientName: string;
    wpm: number;
    accuracy: number;
    durationSeconds: number;
    certificateId: string;
}
/** Render a certificate to a PDF buffer using only server-computed data. */
export declare function renderCertificatePdf(cert: CertificatePdfData): Promise<Buffer>;
//# sourceMappingURL=certificate.service.d.ts.map