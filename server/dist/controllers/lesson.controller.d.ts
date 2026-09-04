import { Request, Response } from 'express';
import { z } from 'zod';
export declare const completeExerciseSchema: z.ZodObject<{
    startTime: z.ZodString;
    endTime: z.ZodString;
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
    variantIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    startTime: string;
    endTime: string;
    typedWords: {
        word: string;
        typed: string;
        correct: boolean;
        timeTakenMs: number;
    }[];
    variantIndex?: number | undefined;
}, {
    startTime: string;
    endTime: string;
    typedWords: {
        word: string;
        typed: string;
        correct: boolean;
        timeTakenMs: number;
    }[];
    variantIndex?: number | undefined;
}>;
export declare function getLessons(req: Request, res: Response): Promise<void>;
export declare function getLesson(req: Request, res: Response): Promise<void>;
export declare function completeExercise(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=lesson.controller.d.ts.map