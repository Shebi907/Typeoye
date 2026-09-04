"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliverContactMessage = deliverContactMessage;
const ContactMessage_1 = __importDefault(require("../models/ContactMessage"));
const mailer_1 = require("../utils/mailer");
const env_1 = require("../config/env");
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
async function deliverContactMessage(input) {
    const record = await ContactMessage_1.default.create(input);
    const recipient = env_1.mailerConfig.to;
    try {
        await (0, mailer_1.sendMail)({
            to: recipient,
            replyTo: input.email,
            subject: `Typeoye Contact Us — ${input.topic}`,
            text: [
                'New contact form submission',
                '',
                `Name:    ${input.name}`,
                `Email:   ${input.email}`,
                `Subject: ${input.topic}`,
                '',
                `Message:\n${input.message}`,
            ].join('\n'),
            html: `
        <h2 style="margin:0 0 12px;font-family:Arial,sans-serif;color:#17171F;">New contact form submission</h2>
        <table style="font-family:Arial,sans-serif;font-size:14px;color:#333;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-weight:bold;color:#17171F;">Name</td></tr>
          <tr><td style="padding:0 0 8px;">${escapeHtml(input.name)}</td></tr>
          <tr><td style="padding:4px 0;font-weight:bold;color:#17171F;">Email</td></tr>
          <tr><td style="padding:0 0 8px;"><a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></td></tr>
          <tr><td style="padding:4px 0;font-weight:bold;color:#17171F;">Subject</td></tr>
          <tr><td style="padding:0 0 8px;">${escapeHtml(input.topic)}</td></tr>
          <tr><td style="padding:4px 0;font-weight:bold;color:#17171F;">Message</td></tr>
          <tr><td style="padding:0 0 8px;white-space:pre-wrap;">${escapeHtml(input.message)}</td></tr>
        </table>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#888;">Sent via the Typeoye Contact form. Reply to this email to respond directly to ${escapeHtml(input.name)}.</p>
      `,
        });
    }
    catch (err) {
        await record.updateOne({ $set: { deliveredBy: 'db', deliverError: String(err) } });
        throw err;
    }
    await record.updateOne({ $set: { deliveredBy: 'email' } });
    return { deliveredBy: 'email' };
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
//# sourceMappingURL=mail.service.js.map