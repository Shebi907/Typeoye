interface SendEmailParams {
    to: string | string[];
    subject: string;
    html: string;
    replyTo?: string;
}
/**
 * Reusable email sending service using Resend.
 */
export declare function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<any>;
export {};
//# sourceMappingURL=emailService.d.ts.map