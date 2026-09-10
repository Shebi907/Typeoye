import { Request, Response } from 'express';
import { z } from 'zod';
export declare const SECURITY_QUESTIONS: readonly ["What is your favorite color?", "What is your favorite food?", "What was your childhood nickname?", "What was your first school's name?", "What is your favorite hobby?"];
export declare const registerSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    securityQuestion: z.ZodEnum<["What is your favorite color?", "What is your favorite food?", "What was your childhood nickname?", "What was your first school's name?", "What is your favorite hobby?"]>;
    securityAnswer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    securityQuestion: "What is your favorite color?" | "What is your favorite food?" | "What was your childhood nickname?" | "What was your first school's name?" | "What is your favorite hobby?";
    password: string;
    securityAnswer: string;
}, {
    username: string;
    email: string;
    securityQuestion: "What is your favorite color?" | "What is your favorite food?" | "What was your childhood nickname?" | "What was your first school's name?" | "What is your favorite hobby?";
    password: string;
    securityAnswer: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const resendVerificationSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    identifier: z.ZodString;
}, "strip", z.ZodTypeAny, {
    identifier: string;
}, {
    identifier: string;
}>;
export declare const verifySecurityAnswerSchema: z.ZodObject<{
    identifier: z.ZodString;
    answer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    identifier: string;
    answer: string;
}, {
    identifier: string;
    answer: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    resetToken: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    resetToken: string;
    newPassword: string;
}, {
    resetToken: string;
    newPassword: string;
}>;
export declare function register(req: Request, res: Response): Promise<void>;
export declare function login(req: Request, res: Response): Promise<void>;
export declare function verifyEmail(_req: Request, res: Response): Promise<void>;
export declare function resendVerification(_req: Request, res: Response): Promise<void>;
export declare function me(req: Request, res: Response): Promise<void>;
export declare function logout(_req: Request, res: Response): Promise<void>;
/** Step 1: Accept email/username. Unknown accounts are rejected explicitly so
 *  the user can try a different identifier; known accounts proceed to their
 *  security question. No recovery token is created here. */
export declare function forgotPassword(req: Request, res: Response): Promise<void>;
/** Step 2: Verify the security answer and issue a short-lived recovery token. */
export declare function verifySecurityAnswer(req: Request, res: Response): Promise<void>;
/** Step 3: Exchange the recovery token for a new password. */
export declare function resetPassword(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map