"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
/**
 * Reusable Nodemailer transporter using Gmail SMTP. Lazily constructed so the
 * SMTP host is only contacted when mail is actually sent — never at boot.
 */
let transporter = null;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: env_1.mailerConfig.user,
                pass: env_1.mailerConfig.pass,
            },
        });
    }
    return transporter;
}
/**
 * Send an email via Gmail SMTP. Throws on delivery failure — callers decide
 * whether to surface the error to the user or degrade gracefully.
 */
async function sendMail({ to, subject, text, html, replyTo }) {
    if (!env_1.mailerConfig.isConfigured) {
        throw new Error('Email sending is not configured (missing EMAIL_USER/EMAIL_PASS).');
    }
    await getTransporter().sendMail({
        from: env_1.mailerConfig.user,
        to,
        subject,
        text,
        html,
        replyTo,
    });
}
//# sourceMappingURL=mailer.js.map