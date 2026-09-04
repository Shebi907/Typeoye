"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const googleAuth_controller_1 = require("../controllers/googleAuth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_middleware_1.validate)(auth_controller_1.registerSchema), auth_controller_1.register);
router.post('/login', (0, validate_middleware_1.validate)(auth_controller_1.loginSchema), auth_controller_1.login);
router.post('/verify-email', auth_controller_1.verifyEmail);
router.post('/resend-verification', auth_controller_1.resendVerification);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.me);
router.post('/logout', auth_controller_1.logout);
// Google OAuth — "Continue with Google"
router.get('/google', googleAuth_controller_1.googleOAuthStart);
router.get('/google/callback', googleAuth_controller_1.googleOAuthCallback);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map