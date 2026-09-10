import { Request, Response } from 'express';
/**
 * Public certificate-test paragraph endpoint (signed-in visitors get persistent
 * history, guests pass `?exclude=` with their localStorage history). Never
 * returns inactive paragraphs, never repeats until the pool cycles, and errors
 * (503) instead of ever sending an empty test.
 */
export declare function getCertificateParagraph(req: Request, res: Response): Promise<void>;
export declare const adminCertificateParagraphs: {
    list: (req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    remove: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=certificateParagraph.controller.d.ts.map