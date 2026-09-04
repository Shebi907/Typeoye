import { Request, Response } from 'express';
import { z } from 'zod';
export declare const generatePracticeSchema: z.ZodObject<{
    type: z.ZodEnum<["character", "combination", "word", "sentence", "paragraph", "weak", "quick", "custom"]>;
    difficulty: z.ZodDefault<z.ZodEnum<["beginner", "intermediate", "advanced"]>>;
    duration: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<15>, z.ZodLiteral<30>, z.ZodLiteral<60>, z.ZodLiteral<120>, z.ZodLiteral<300>, z.ZodLiteral<600>, z.ZodLiteral<900>]>>;
    targetKeys: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    wordCount: z.ZodDefault<z.ZodNumber>;
    rotation: z.ZodDefault<z.ZodNumber>;
    customText: z.ZodOptional<z.ZodString>;
    session: z.ZodOptional<z.ZodEnum<["0", "1", "true", "false"]>>;
}, "strip", z.ZodTypeAny, {
    type: "word" | "custom" | "paragraph" | "sentence" | "character" | "combination" | "weak" | "quick";
    wordCount: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    targetKeys: string[];
    duration: 60 | 120 | 300 | 15 | 600 | 900 | 30;
    rotation: number;
    session?: "0" | "1" | "true" | "false" | undefined;
    customText?: string | undefined;
}, {
    type: "word" | "custom" | "paragraph" | "sentence" | "character" | "combination" | "weak" | "quick";
    session?: "0" | "1" | "true" | "false" | undefined;
    wordCount?: number | undefined;
    difficulty?: "beginner" | "intermediate" | "advanced" | undefined;
    targetKeys?: string[] | undefined;
    duration?: 60 | 120 | 300 | 15 | 600 | 900 | 30 | undefined;
    rotation?: number | undefined;
    customText?: string | undefined;
}>;
export declare function generatePractice(req: Request, res: Response): Promise<void>;
export declare function getPracticeOverview(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=practice.controller.d.ts.map