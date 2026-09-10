"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.verifySecurityAnswerSchema = exports.forgotPasswordSchema = exports.verifyEmailSchema = exports.resendVerificationSchema = exports.loginSchema = exports.registerSchema = exports.SECURITY_QUESTIONS = void 0;
exports.register = register;
exports.login = login;
exports.verifyEmail = verifyEmail;
exports.resendVerification = resendVerification;
exports.me = me;
exports.logout = logout;
exports.forgotPassword = forgotPassword;
exports.verifySecurityAnswer = verifySecurityAnswer;
exports.resetPassword = resetPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const User_1 = __importDefault(require("../models/User"));
const Profile_1 = __importDefault(require("../models/Profile"));
const Settings_1 = __importDefault(require("../models/Settings"));
const UserProgress_1 = __importDefault(require("../models/UserProgress"));
const Streak_1 = __importDefault(require("../models/Streak"));
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const gamification_service_1 = require("../services/gamification.service");
const emailService_1 = require("../services/emailService");
const env_1 = require("../config/env");
exports.SECURITY_QUESTIONS = [
    'What is your favorite color?',
    'What is your favorite food?',
    'What was your childhood nickname?',
    "What was your first school's name?",
    'What is your favorite hobby?',
];
exports.registerSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    securityQuestion: zod_1.z.enum(exports.SECURITY_QUESTIONS, { errorMap: () => ({ message: 'Please select a valid security question' }) }),
    securityAnswer: zod_1.z.string().min(1, 'Security answer is required').max(100),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.resendVerificationSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(1, 'Email or username is required').max(100),
});
exports.verifySecurityAnswerSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(1, 'Email or username is required').max(100),
    answer: zod_1.z.string().min(1, 'Answer is required').max(100),
});
exports.resetPasswordSchema = zod_1.z.object({
    resetToken: zod_1.z.string().min(1, 'Recovery token is required'),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
/** Helper to generate cryptographic token and hash for storage */
function createVerificationToken() {
    const unhashedToken = crypto_1.default.randomBytes(32).toString('hex');
    const hashedToken = crypto_1.default.createHash('sha256').update(unhashedToken).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return { unhashedToken, hashedToken, expires };
}
async function sendVerificationEmail(email, rawToken) {
    const clientUrl = process.env.CLIENT_URL || env_1.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await (0, emailService_1.sendEmail)({
        to: email,
        subject: 'Verify your email address for Typeoye',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #17171F;">
        <h2 style="color: #4361EE;">Welcome to Typeoye!</h2>
        <p>Thank you for signing up. Please verify your email address to activate your account and start your typing journey.</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4361EE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 13px; color: #666;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 13px; color: #4361EE; word-break: break-all;">${verifyUrl}</p>
        <p style="font-size: 12px; color: #999; margin-top: 40px;">This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
    });
}
async function register(req, res) {
    try {
        const { username, email, password, securityQuestion, securityAnswer } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User_1.default.findOne({
            $or: [{ email: normalizedEmail }, { username }],
        });
        if (existingUser) {
            const field = existingUser.email === normalizedEmail ? 'Email' : 'Username';
            (0, response_1.sendError)(res, `${field} is already taken`, 409);
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const securityAnswerHash = await bcryptjs_1.default.hash(securityAnswer.toLowerCase().trim(), 12);
        const user = await User_1.default.create({
            username,
            email: normalizedEmail,
            passwordHash,
            emailVerified: true,
            securityQuestion,
            securityAnswerHash,
        });
        // Create companion documents idempotently
        const [profile, settings] = await Promise.all([
            Profile_1.default.findOneAndUpdate({ userId: user._id }, { $setOnInsert: { displayName: username } }, { new: true, upsert: true }),
            Settings_1.default.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
            UserProgress_1.default.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
            Streak_1.default.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
        ]);
        const synced = await (0, gamification_service_1.syncProfileLevel)(user._id);
        const token = (0, jwt_1.signToken)(user._id.toString());
        (0, response_1.sendSuccess)(res, {
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                authProvider: user.authProvider,
                emailVerified: true,
                createdAt: user.createdAt,
            },
            profile: synced ?? profile,
            settings,
        }, 201);
    }
    catch (err) {
        console.error(`[auth] REGISTER FAILED for "${req.body?.username ?? req.body?.email}" from ${req.ip}:`, err);
        (0, response_1.sendError)(res, 'Registration failed. Please try again.', 500);
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User_1.default.findOne({ email: normalizedEmail });
        if (!user) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        // Google-only accounts have an unguessable password hash — reject them here
        // so the user gets actionable guidance instead of a generic failure.
        if (user.authProvider === 'google') {
            (0, response_1.sendError)(res, "This account was created with Google. Please use 'Continue with Google' to sign in.", 401);
            return;
        }
        const passwordMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!passwordMatch) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        // Self-heal companion documents
        const [profile, settings] = await Promise.all([
            Profile_1.default.findOneAndUpdate({ userId: user._id }, { $setOnInsert: { displayName: user.username } }, { new: true, upsert: true }),
            Settings_1.default.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
        ]);
        const synced = await (0, gamification_service_1.syncProfileLevel)(user._id);
        const token = (0, jwt_1.signToken)(user._id.toString());
        (0, response_1.sendSuccess)(res, {
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                authProvider: user.authProvider,
                emailVerified: user.emailVerified ?? true,
                createdAt: user.createdAt,
            },
            profile: synced ?? profile,
            settings,
        });
    }
    catch (err) {
        console.error(`[auth] LOGIN FAILED for "${req.body?.email}" from ${req.ip}:`, err);
        (0, response_1.sendError)(res, 'Login failed. Please try again.', 500);
    }
}
async function verifyEmail(_req, res) {
    (0, response_1.sendSuccess)(res, {
        message: 'Email verification is no longer required. You can log in directly.',
    });
}
async function resendVerification(_req, res) {
    (0, response_1.sendSuccess)(res, {
        message: 'Email verification is no longer required. You can log in directly.',
    });
}
async function me(req, res) {
    try {
        const user = req.user;
        const [profile, settings] = await Promise.all([
            Profile_1.default.findOne({ userId: user._id }),
            Settings_1.default.findOne({ userId: user._id }),
        ]);
        const synced = await (0, gamification_service_1.syncProfileLevel)(user._id);
        (0, response_1.sendSuccess)(res, {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                authProvider: user.authProvider,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
            },
            profile: synced ?? profile,
            settings,
        });
    }
    catch (err) {
        console.error('Me error:', err);
        (0, response_1.sendError)(res, 'Failed to fetch user data', 500);
    }
}
async function logout(_req, res) {
    (0, response_1.sendSuccess)(res, { message: 'Logged out successfully' });
}
/** Predefined security questions — no user-defined questions allowed. */
async function findUserByIdentifier(identifier) {
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const query = isEmail
        ? { email: trimmed.toLowerCase() }
        : { username: trimmed };
    return User_1.default.findOne(query);
}
/** Step 1: Accept email/username. Unknown accounts are rejected explicitly so
 *  the user can try a different identifier; known accounts proceed to their
 *  security question. No recovery token is created here. */
async function forgotPassword(req, res) {
    try {
        const { identifier } = req.body;
        const trimmed = identifier.trim();
        const user = await findUserByIdentifier(identifier);
        if (!user) {
            const message = trimmed.includes('@')
                ? 'This email address is not registered with Typeoye.'
                : 'This username is not registered with Typeoye.';
            (0, response_1.sendError)(res, message, 400);
            return;
        }
        if (user.recoveryLockedUntil && user.recoveryLockedUntil.getTime() > Date.now()) {
            (0, response_1.sendError)(res, 'Too many recovery attempts. Please try again later.', 429);
            return;
        }
        if (!user.securityQuestion || !user.securityAnswerHash) {
            (0, response_1.sendError)(res, 'This account has not set up a security question yet. You can set one up from your profile.', 400);
            return;
        }
        (0, response_1.sendSuccess)(res, {
            message: 'Account found. Answer your security question to continue.',
            securityQuestion: user.securityQuestion,
        });
    }
    catch (err) {
        console.error('[auth] FORGOT PASSWORD error:', err);
        (0, response_1.sendError)(res, 'Something went wrong. Please try again.', 500);
    }
}
/** Step 2: Verify the security answer and issue a short-lived recovery token. */
async function verifySecurityAnswer(req, res) {
    try {
        const { identifier, answer } = req.body;
        const user = await findUserByIdentifier(identifier);
        if (!user || !user.securityAnswerHash) {
            (0, response_1.sendError)(res, 'Invalid answer. Please try again.', 400);
            return;
        }
        if (user.recoveryLockedUntil && user.recoveryLockedUntil.getTime() > Date.now()) {
            (0, response_1.sendError)(res, 'Too many recovery attempts. Please try again later.', 429);
            return;
        }
        const answerMatch = await bcryptjs_1.default.compare(answer.toLowerCase().trim(), user.securityAnswerHash);
        if (!answerMatch) {
            const attempts = (user.recoveryFailedAttempts || 0) + 1;
            const update = { recoveryFailedAttempts: attempts };
            if (attempts >= 5) {
                update.recoveryLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            }
            await User_1.default.updateOne({ _id: user._id }, { $set: update });
            (0, response_1.sendError)(res, 'Invalid answer. Please try again.', 400);
            return;
        }
        // Answer is correct — issue a single-use recovery token
        const rawToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await User_1.default.updateOne({ _id: user._id }, {
            $set: {
                recoveryToken: hashedToken,
                recoveryTokenExpires: expires,
                recoveryFailedAttempts: 0,
                recoveryLockedUntil: null,
            },
        });
        (0, response_1.sendSuccess)(res, { resetToken: rawToken });
    }
    catch (err) {
        console.error('[auth] VERIFY SECURITY ANSWER error:', err);
        (0, response_1.sendError)(res, 'Something went wrong. Please try again.', 500);
    }
}
/** Step 3: Exchange the recovery token for a new password. */
async function resetPassword(req, res) {
    try {
        const { resetToken, newPassword } = req.body;
        const hashedToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        const user = await User_1.default.findOne({
            recoveryToken: hashedToken,
            recoveryTokenExpires: { $gt: new Date() },
        });
        if (!user) {
            (0, response_1.sendError)(res, 'Invalid or expired recovery token. Please try again.', 400);
            return;
        }
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        user.authProvider = user.authProvider === 'local' ? 'local' : 'both';
        user.recoveryToken = null;
        user.recoveryTokenExpires = null;
        user.recoveryFailedAttempts = 0;
        user.recoveryLockedUntil = null;
        await user.save();
        (0, response_1.sendSuccess)(res, { message: 'Password reset successfully' });
    }
    catch (err) {
        console.error('[auth] RESET PASSWORD error:', err);
        (0, response_1.sendError)(res, 'Something went wrong. Please try again.', 500);
    }
}
//# sourceMappingURL=auth.controller.js.map