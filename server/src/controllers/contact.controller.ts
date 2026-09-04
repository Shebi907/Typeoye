import { Request, Response } from 'express';
import { z } from 'zod';
import { deliverContactMessage } from '../services/mail.service';
import { sendSuccess, sendError } from '../utils/response';

const TOPICS = ['General question', 'Bug report', 'Feature request', 'Account issue', 'Other'] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Enter a valid email address').max(200),
  topic: z.enum(TOPICS).default('General question'),
  message: z.string().trim().min(1, 'Message is required').max(5000),
});

export async function submitContact(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as z.infer<typeof contactSchema>;
    const { deliveredBy } = await deliverContactMessage(body);
    sendSuccess(res, { deliveredBy, message: 'Message sent! We\u2019ll get back to you soon.' }, 201);
  } catch (err) {
    const message =
      err instanceof Error && err.message === 'Email sending is not configured.'
        ? 'Email sending is not configured on the server.'
        : 'Message could not be sent. Please try again later.';
    console.error('[contact] submitContact error:', err);
    sendError(res, message, 500);
  }
}
