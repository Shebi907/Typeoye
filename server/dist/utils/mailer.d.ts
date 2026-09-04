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
export declare function sendMail({ to, subject, text, html, replyTo }: SendMailOptions): Promise<void>;
//# sourceMappingURL=mailer.d.ts.map