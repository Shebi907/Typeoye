import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { mailerConfig } from '../config/env';

/**
 * Reusable Nodemailer transporter using Gmail SMTP. Lazily constructed so the
 * SMTP host is only contacted when mail is actually sent — never at boot.
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: mailerConfig.user,
        pass: mailerConfig.pass,
      },
    });
  }
  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** The address replies should go to (e.g. the contact form sender). */
  replyTo?: string;
}

/**
 * Send an email via Gmail SMTP. Throws on delivery failure — callers decide
 * whether to surface the error to the user or degrade gracefully.
 */
export async function sendMail({ to, subject, text, html, replyTo }: SendMailOptions): Promise<void> {
  if (!mailerConfig.isConfigured) {
    throw new Error('Email sending is not configured (missing EMAIL_USER/EMAIL_PASS).');
  }
  await getTransporter().sendMail({
    from: mailerConfig.user,
    to,
    subject,
    text,
    html,
    replyTo,
  });
}