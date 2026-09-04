import { Request, Response } from 'express';
import { z } from 'zod';
export declare const contactSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    topic: z.ZodDefault<z.ZodEnum<["General question", "Bug report", "Feature request", "Account issue", "Other"]>>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    email: string;
    name: string;
    topic: "General question" | "Bug report" | "Feature request" | "Account issue" | "Other";
}, {
    message: string;
    email: string;
    name: string;
    topic?: "General question" | "Bug report" | "Feature request" | "Account issue" | "Other" | undefined;
}>;
export declare function submitContact(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=contact.controller.d.ts.map