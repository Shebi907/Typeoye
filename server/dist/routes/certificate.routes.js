"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificate_controller_1 = require("../controllers/certificate.controller");
const certificateParagraph_controller_1 = require("../controllers/certificateParagraph.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
// Public — no sign-in required anywhere in the certificate flow.
router.get('/config', certificate_controller_1.getCertificateConfig);
router.post('/guest', rateLimit_middleware_1.certificateLimiter, (0, validate_middleware_1.validate)(certificate_controller_1.guestCertificateSchema), certificate_controller_1.generateGuestCertificate);
// Certificate-test content: signed-in visitors get persistent no-repeat
// selection, guests get client-side exclusion via `?exclude=`.
router.get('/paragraph', auth_middleware_1.optionalAuthenticate, certificateParagraph_controller_1.getCertificateParagraph);
exports.default = router;
//# sourceMappingURL=certificate.routes.js.map