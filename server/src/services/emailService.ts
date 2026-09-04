import { Resend } from 'resend';
import { resendConfig } from '../config/env';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Reusable email sending service using Resend.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<any> {
  const apiKey = resendConfig.apiKey;
  const fromEmail = resendConfig.fromEmail;

  if (!apiKey) {
    throw new Error('Email service failed: Missing RESEND_API_KEY environment variable.');
  }

  // Validate recipient email
  if (!to || (Array.isArray(to) && to.length === 0)) {
    throw new Error('Email service failed: Invalid recipient email (to).');
  }

  const recipientList = Array.isArray(to) ? to : [to];
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: `Typeoye <${fromEmail}>`,
      to: recipientList,
      subject,
      html,
      replyTo,
    });

    if (error) {
      // Resend API returned an error
      console.error('[emailService] Resend API error:', error.message);
      throw new Error(`Unable to send verification email. Please try again. (${error.message})`);
    }

    if (!data) {
      throw new Error('Email service failed: No data returned from Resend and no error specified.');
    }

    console.log(`[emailService] Resend API request succeeded. Email ID: ${data.id}`);
    return data;
  } catch (err: any) {
    console.error('[emailService] Failed email delivery:', err.message);
    throw err;
  }
}

