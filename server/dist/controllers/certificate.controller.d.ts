import { Request, Response } from 'express';
import { z } from 'zod';
/**
 * Public config so the client knows how long a certificate test runs
 * (admins can change it in Settings without a deploy).
 */
export declare function getCertificateConfig(_req: Request, res: Response): Promise<void>;
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
export declare const guestCertificateSchema: z.ZodObject<{
    startTime: z.ZodString;
    endTime: z.ZodString;
    recipientName: z.ZodString;
    typedWords: z.ZodArray<z.ZodObject<{
        word: z.ZodString;
        typed: z.ZodString;
        correct: z.ZodBoolean;
        timeTakenMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        word: string;
        typed: string;
        correct: boolean;
        timeTakenMs: number;
    }, {
        word: string;
        typed: string;
        correct: boolean;
        timeTakenMs: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    startTime: string;
    endTime: string;
    typedWords: {
        word: string;
        typed: string;
        correct: boolean;
        timeTakenMs: number;
    }[];
    recipientName: string;
}, {
    startTime: string;
    endTime: string;
    typedWords: {
        word: string;
        typed: string;
        correct: boolean;
        timeTakenMs: number;
    }[];
    recipientName: string;
}>;
export declare function generateGuestCertificate(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=certificate.controller.d.ts.map