"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_controller_1 = require("../controllers/contact.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
router.post('/messages', rateLimit_middleware_1.contactLimiter, (0, validate_middleware_1.validate)(contact_controller_1.contactSchema), contact_controller_1.submitContact);
exports.default = router;
//# sourceMappingURL=contact.routes.js.map