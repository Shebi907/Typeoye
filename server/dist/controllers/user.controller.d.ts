import { Request, Response } from 'express';
import { z } from 'zod';
export declare const updateSettingsSchema: z.ZodObject<{
    theme: z.ZodOptional<z.ZodEnum<["light", "dark", "system"]>>;
    font: z.ZodOptional<z.ZodEnum<["jetbrains", "fira", "cascadia"]>>;
    fontSize: z.ZodOptional<z.ZodNumber>;
    soundEnabled: z.ZodOptional<z.ZodBoolean>;
    caretStyle: z.ZodOptional<z.ZodEnum<["bar", "block", "underline"]>>;
    testDuration: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<60>, z.ZodLiteral<120>, z.ZodLiteral<300>, z.ZodLiteral<600>, z.ZodLiteral<900>]>>;
    wordCount: z.ZodOptional<z.ZodNumber>;
    includeNumbers: z.ZodOptional<z.ZodBoolean>;
    includePunctuation: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    theme?: "light" | "dark" | "system" | undefined;
    font?: "jetbrains" | "fira" | "cascadia" | undefined;
    fontSize?: number | undefined;
    soundEnabled?: boolean | undefined;
    caretStyle?: "bar" | "block" | "underline" | undefined;
    testDuration?: 60 | 120 | 300 | 600 | 900 | undefined;
    wordCount?: number | undefined;
    includeNumbers?: boolean | undefined;
    includePunctuation?: boolean | undefined;
}, {
    theme?: "light" | "dark" | "system" | undefined;
    font?: "jetbrains" | "fira" | "cascadia" | undefined;
    fontSize?: number | undefined;
    soundEnabled?: boolean | undefined;
    caretStyle?: "bar" | "block" | "underline" | undefined;
    testDuration?: 60 | 120 | 300 | 600 | 900 | undefined;
    wordCount?: number | undefined;
    includeNumbers?: boolean | undefined;
    includePunctuation?: boolean | undefined;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
    currentPassword: string;
}, {
    newPassword: string;
    currentPassword: string;
}>;
export declare const setPasswordSchema: z.ZodObject<{
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
}, {
    newPassword: string;
}>;
export declare const setSecurityQuestionSchema: z.ZodObject<{
    question: z.ZodEnum<["What is your favorite color?", "What is your favorite food?", "What was your childhood nickname?", "What was your first school's name?", "What is your favorite hobby?"]>;
    answer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    answer: string;
    question: "What is your favorite color?" | "What is your favorite food?" | "What was your childhood nickname?" | "What was your first school's name?" | "What is your favorite hobby?";
}, {
    answer: string;
    question: "What is your favorite color?" | "What is your favorite food?" | "What was your childhood nickname?" | "What was your first school's name?" | "What is your favorite hobby?";
}>;
export declare function getProfile(req: Request, res: Response): Promise<void>;
/** Authenticated own-profile: stats always belong to the JWT user, never to a
 *  userId taken from the URL/body/query. */
export declare function getMyProfile(req: Request, res: Response): Promise<void>;
export declare function updateSettings(req: Request, res: Response): Promise<void>;
export declare function getAchievements(req: Request, res: Response): Promise<void>;
/**
 * Store a user's profile picture. Accepts a base64 data URL (resized on the
 * client), writes it to /uploads/avatars and stores the URL on the Profile.
 */
export declare function updateAvatar(req: Request, res: Response): Promise<void>;
/** Remove a user's profile picture and its stored file. */
export declare function removeAvatar(req: Request, res: Response): Promise<void>;
/** Verify the current password and replace it with a newly hashed one. */
export declare function changePassword(req: Request, res: Response): Promise<void>;
/** First-time password for a Google-only account. Flips the provider to
 *  'local' so the user can then sign in with email + password too. */
export declare function setPassword(req: Request, res: Response): Promise<void>;
/** Returns whether the user has a security question configured (never the answer). */
export declare function getSecurityQuestionStatus(req: Request, res: Response): Promise<void>;
/** Set or update the user's security question (answer stored only as a bcrypt hash). */
export declare function setSecurityQuestion(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=user.controller.d.ts.map