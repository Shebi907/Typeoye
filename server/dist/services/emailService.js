"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
const env_1 = require("../config/env");
/**
 * Reusable email sending service using Resend.
 */
async function sendEmail({ to, subject, html, replyTo }) {
    const apiKey = env_1.resendConfig.apiKey;
    const fromEmail = env_1.resendConfig.fromEmail;
    if (!apiKey) {
        throw new Error('Email service failed: Missing RESEND_API_KEY environment variable.');
    }
    // Validate recipient email
    if (!to || (Array.isArray(to) && to.length === 0)) {
        throw new Error('Email service failed: Invalid recipient email (to).');
    }
    const recipientList = Array.isArray(to) ? to : [to];
    const resend = new resend_1.Resend(apiKey);
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
    }
    catch (err) {
        console.error('[emailService] Failed email delivery:', err.message);
        throw err;
    }
}
//# sourceMappingURL=emailService.js.map