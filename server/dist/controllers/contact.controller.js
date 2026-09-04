"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactSchema = void 0;
exports.submitContact = submitContact;
const zod_1 = require("zod");
const mail_service_1 = require("../services/mail.service");
const response_1 = require("../utils/response");
const TOPICS = ['General question', 'Bug report', 'Feature request', 'Account issue', 'Other'];
exports.contactSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name is required').max(100),
    email: zod_1.z.string().trim().email('Enter a valid email address').max(200),
    topic: zod_1.z.enum(TOPICS).default('General question'),
    message: zod_1.z.string().trim().min(1, 'Message is required').max(5000),
});
async function submitContact(req, res) {
    try {
        const body = req.body;
        const { deliveredBy } = await (0, mail_service_1.deliverContactMessage)(body);
        (0, response_1.sendSuccess)(res, { deliveredBy, message: 'Message sent! We\u2019ll get back to you soon.' }, 201);
    }
    catch (err) {
        const message = err instanceof Error && err.message === 'Email sending is not configured.'
            ? 'Email sending is not configured on the server.'
            : 'Message could not be sent. Please try again later.';
        console.error('[contact] submitContact error:', err);
        (0, response_1.sendError)(res, message, 500);
    }
}
//# sourceMappingURL=contact.controller.js.map