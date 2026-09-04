"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePrivacyPolicy = exports.getPrivacyPolicy = exports.updateSchema = void 0;
const zod_1 = require("zod");
const PrivacyPolicy_1 = __importDefault(require("../models/PrivacyPolicy"));
const response_1 = require("../utils/response");
exports.updateSchema = zod_1.z.object({
    introduction: zod_1.z.string(),
    lastUpdated: zod_1.z.string().datetime().optional(),
    sections: zod_1.z.array(zod_1.z.object({
        _id: zod_1.z.string().optional(),
        title: zod_1.z.string(),
        content: zod_1.z.string(),
        order: zod_1.z.number(),
    }))
});
const getPrivacyPolicy = async (req, res) => {
    try {
        let policy = await PrivacyPolicy_1.default.findOne();
        if (!policy) {
            policy = await PrivacyPolicy_1.default.create({
                introduction: 'Your privacy is important to us. This Privacy Policy explains how Typeoye collects, uses, and protects your information.',
                lastUpdated: new Date(),
                sections: [
                    { title: 'Information We Collect', content: '', order: 1 },
                    { title: 'How We Use Your Information', content: '', order: 2 },
                    { title: 'Data Sharing and Disclosure', content: '', order: 3 },
                    { title: 'Data Security', content: '', order: 4 },
                    { title: 'Your Rights and Choices', content: '', order: 5 },
                    { title: 'Children\'s Privacy', content: '', order: 6 },
                    { title: 'Changes to This Policy', content: '', order: 7 },
                    { title: 'Contact Us', content: '', order: 8 },
                ]
            });
        }
        (0, response_1.sendSuccess)(res, policy);
    }
    catch (err) {
        console.error('Error fetching privacy policy:', err);
        (0, response_1.sendError)(res, 'Internal Server Error', 500);
    }
};
exports.getPrivacyPolicy = getPrivacyPolicy;
const updatePrivacyPolicy = async (req, res) => {
    try {
        const data = req.body;
        let policy = await PrivacyPolicy_1.default.findOne();
        if (!policy) {
            policy = new PrivacyPolicy_1.default();
        }
        policy.introduction = data.introduction;
        if (data.lastUpdated)
            policy.lastUpdated = new Date(data.lastUpdated);
        else
            policy.lastUpdated = new Date();
        policy.sections = data.sections;
        await policy.save();
        (0, response_1.sendSuccess)(res, policy);
    }
    catch (err) {
        console.error('Error updating privacy policy:', err);
        (0, response_1.sendError)(res, 'Internal Server Error', 500);
    }
};
exports.updatePrivacyPolicy = updatePrivacyPolicy;
//# sourceMappingURL=privacy.controller.js.map