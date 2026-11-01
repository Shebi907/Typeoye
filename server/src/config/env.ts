import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/typeoye'),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  // Render (and most PaaS hosts) sit behind a reverse proxy that sets
  // X-Forwarded-For. Trust exactly one hop so express-rate-limit and any
  // req.ip usage correctly identify the real client instead of Render's proxy.
  APP_BASE_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_TO: z.string().default('contact.typeoye@gmail.com'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('onboarding@resend.dev'),
  KEYBOARD_SHORTCUTS_STORAGE_DIR: z.string().trim().min(1).optional(),
  KEYBOARD_SHORTCUT_PDF_MAX_BYTES: z.coerce.number().int().min(1024).max(100 * 1024 * 1024).default(20 * 1024 * 1024),
});

export const googleOAuth = {
  clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  get isConfigured(): boolean { return Boolean(this.clientId && this.clientSecret); },
};

function validateEnv(): z.infer<typeof envSchema> {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = validateEnv();

export const mailerConfig = {
  user: env.EMAIL_USER ?? '',
  pass: env.EMAIL_PASS ?? '',
  to: env.EMAIL_TO,
  get isConfigured(): boolean { return Boolean(this.user) && Boolean(this.pass); },
};

export const resendConfig = {
  get apiKey(): string { return process.env.RESEND_API_KEY || env.RESEND_API_KEY || ''; },
  get fromEmail(): string { return process.env.RESEND_FROM_EMAIL || env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'; },
};
