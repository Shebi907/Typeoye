export interface ContactSubmission {
    name: string;
    email: string;
    topic: string;
    message: string;
}
/**
 * Deliver a contact-form submission to the support Gmail inbox via the
 * existing Nodemailer/Gmail SMTP setup.
 *
 * The message is always recorded in the DB for the audit trail, then emailed
 * to the configured recipient Gmail address with the sender's address set as
 * reply-to. If Gmail SMTP delivery fails (auth issue, network error), this
 * throws so the endpoint can surface a clear error to the user instead of
 * silently reporting success.
 */
export declare function deliverContactMessage(input: ContactSubmission): Promise<{
    deliveredBy: 'email';
}>;
//# sourceMappingURL=mail.service.d.ts.map