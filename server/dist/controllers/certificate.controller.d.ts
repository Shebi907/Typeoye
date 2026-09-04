import { Request, Response } from 'express';
import { z } from 'zod';
/**
 * Public config so the client knows how long a certificate test runs
 * (admins can change it in Settings without a deploy).
 */
export declare function getCertificateConfig(_req: Request, res: Response): Promise<void>;
/**
 * One-shot guest certificate generation. The raw keystroke data is verified
 * here — stats are recomputed from typedWords exactly like every other saved
 * session, and NOTHING is persisted (no user, no session record). The PDF is
 * streamed straight back to the browser.
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