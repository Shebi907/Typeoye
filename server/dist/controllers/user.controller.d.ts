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
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare function getProfile(req: Request, res: Response): Promise<void>;
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
//# sourceMappingURL=user.controller.d.ts.map