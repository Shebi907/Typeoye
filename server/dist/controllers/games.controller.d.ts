import { Request, Response } from 'express';
import { z } from 'zod';
export declare const gameSchema: z.ZodObject<{
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
} & {
    game: z.ZodEnum<["typingRace", "fallingWords", "suddenDeath"]>;
    score: z.ZodOptional<z.ZodNumber>;
    winner: z.ZodOptional<z.ZodEnum<["user", "opponent"]>>;
    opponentWpm: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    game: "typingRace" | "fallingWords" | "suddenDeath";
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
    score?: number | undefined;
    winner?: "user" | "opponent" | undefined;
    opponentWpm?: number | undefined;
}, {
    game: "typingRace" | "fallingWords" | "suddenDeath";
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
    score?: number | undefined;
    winner?: "user" | "opponent" | undefined;
    opponentWpm?: number | undefined;
}>;
/**
 * Submits a completed game session.
 * Authed users: session saved to DB (TypingResult + GameResult), XP/achievements awarded.
 * Guests: computed stats returned without persistence.
 */
export declare function completeGame(req: Request, res: Response): Promise<void>;
export declare function getGameHistory(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=games.controller.d.ts.map