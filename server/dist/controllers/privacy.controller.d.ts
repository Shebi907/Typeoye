import { Request, Response } from 'express';
import { z } from 'zod';
export declare const updateSchema: z.ZodObject<{
    introduction: z.ZodString;
    lastUpdated: z.ZodOptional<z.ZodString>;
    sections: z.ZodArray<z.ZodObject<{
        _id: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        content: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        title: string;
        order: number;
        content: string;
        _id?: string | undefined;
    }, {
        title: string;
        order: number;
        content: string;
        _id?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    introduction: string;
    sections: {
        title: string;
        order: number;
        content: string;
        _id?: string | undefined;
    }[];
    lastUpdated?: string | undefined;
}, {
    introduction: string;
    sections: {
        title: string;
        order: number;
        content: string;
        _id?: string | undefined;
    }[];
    lastUpdated?: string | undefined;
}>;
export declare const getPrivacyPolicy: (req: Request, res: Response) => Promise<void>;
export declare const updatePrivacyPolicy: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=privacy.controller.d.ts.map