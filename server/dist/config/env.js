"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendConfig = exports.mailerConfig = exports.env = exports.googleOAuth = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3001'),
    MONGODB_URI: zod_1.z.string().default('mongodb://localhost:27017/typeoye'),
    JWT_SECRET: zod_1.z.string().min(10),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    CLIENT_URL: zod_1.z.string().default('http://localhost:5173'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // Optional — only required when Google Sign-In is enabled.
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    // Gmail SMTP credentials for sending mail (contact form, future features).
    // EMAIL_PASS must be a 16-character Gmail app password (no spaces).
    EMAIL_USER: zod_1.z.string().optional(),
    EMAIL_PASS: zod_1.z.string().optional(),
    // Delivery address for contact-form submissions.
    EMAIL_TO: zod_1.z.string().default('contact.typeoye@gmail.com'),
    RESEND_API_KEY: zod_1.z.string().optional(),
    RESEND_FROM_EMAIL: zod_1.z.string().default('onboarding@resend.dev'),
});
// Backend-only Google OAuth config. The secret is never sent to the client;
// it is used exclusively to exchange the authorization code for tokens.
exports.googleOAuth = {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    get isConfigured() {
        return Boolean(this.clientId && this.clientSecret);
    },
};
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
// Gmail SMTP config for sending mail. `isConfigured` is true only when both the
// address and app password are present, so sending guard-rails gate on intent.
// Deliberately not exported with `env` — mailer reads it directly.
exports.mailerConfig = {
    user: exports.env.EMAIL_USER ?? '',
    pass: exports.env.EMAIL_PASS ?? '',
    to: exports.env.EMAIL_TO,
    get isConfigured() {
        return Boolean(this.user) && Boolean(this.pass);
    },
};
exports.resendConfig = {
    get apiKey() {
        return process.env.RESEND_API_KEY || exports.env.RESEND_API_KEY || '';
    },
    get fromEmail() {
        return process.env.RESEND_FROM_EMAIL || exports.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    },
};
//# sourceMappingURL=env.js.map