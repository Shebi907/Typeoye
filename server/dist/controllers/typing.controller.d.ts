import { Request, Response } from 'express';
import { z } from 'zod';
export declare const sessionSchema: z.ZodObject<{
    mode: z.ZodEnum<["test", "practice", "lesson", "game"]>;
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
    textSource: z.ZodEnum<["generated", "lesson", "custom"]>;
    exerciseId: z.ZodOptional<z.ZodString>;
    clientWpm: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    clientAccuracy: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    practiceType: z.ZodOptional<z.ZodString>;
    practiceDifficulty: z.ZodOptional<z.ZodNumber>;
    focusKeys: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    certificateParagraphId: z.ZodOptional<z.ZodString>;
    certificateParagraphText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mode: "test" | "practice" | "lesson" | "game";
    startTime: string;
    endTime: string;
    typedWords: {
        word: string;
        typed: string;
        correct: boolean;
        timeTakenMs: number;
    }[];
    textSource: "lesson" | "custom" | "generated";
    clientWpm: number;
    clientAccuracy: number;
    certificateParagraphId?: string | undefined;
    certificateParagraphText?: string | undefined;
    exerciseId?: string | undefined;
    focusKeys?: string[] | undefined;
    practiceType?: string | undefined;
    practiceDifficulty?: number | undefined;
}, {
    mode: "test" | "practice" | "lesson" | "game";
    startTime: string;
    endTime: string;
    typedWords: {
        word: string;
        typed: string;
        correct: boolean;
        timeTakenMs: number;
    }[];
    textSource: "lesson" | "custom" | "generated";
    certificateParagraphId?: string | undefined;
    certificateParagraphText?: string | undefined;
    exerciseId?: string | undefined;
    clientWpm?: number | undefined;
    clientAccuracy?: number | undefined;
    focusKeys?: string[] | undefined;
    practiceType?: string | undefined;
    practiceDifficulty?: number | undefined;
}>;
export declare function getRandomParagraph(req: Request, res: Response): Promise<void>;
export declare function submitSession(req: Request, res: Response): Promise<void>;
export declare function getResults(req: Request, res: Response): Promise<void>;
export declare function getResult(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=typing.controller.d.ts.map