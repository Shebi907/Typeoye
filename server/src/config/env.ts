import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/typeoye'),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Optional — only required when Google Sign-In is enabled.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Gmail SMTP credentials for sending mail (contact form, future features).
  // EMAIL_PASS must be a 16-character Gmail app password (no spaces).
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  // Delivery address for contact-form submissions.
  EMAIL_TO: z.string().default('shahzaibakbar874@gmail.com'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('onboarding@resend.dev'),
});

// Backend-only Google OAuth config. The secret is never sent to the client;
// it is used exclusively to exchange the authorization code for tokens.
export const googleOAuth = {
  clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  get isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  },
};

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Gmail SMTP config for sending mail. `isConfigured` is true only when both the
// address and app password are present, so sending guard-rails gate on intent.
// Deliberately not exported with `env` — mailer reads it directly.
export const mailerConfig = {
  user: env.EMAIL_USER ?? '',
  pass: env.EMAIL_PASS ?? '',
  to: env.EMAIL_TO,
  get isConfigured(): boolean {
    return Boolean(this.user) && Boolean(this.pass);
  },
};

export const resendConfig = {
  get apiKey(): string {
    return process.env.RESEND_API_KEY || env.RESEND_API_KEY || '';
  },
  get fromEmail(): string {
    return process.env.RESEND_FROM_EMAIL || env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  },
};

