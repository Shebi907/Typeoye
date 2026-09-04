"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const privacy_controller_1 = require("../controllers/privacy.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
router.get('/', privacy_controller_1.getPrivacyPolicy);
router.put('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(privacy_controller_1.updateSchema), privacy_controller_1.updatePrivacyPolicy);
exports.default = router;
//# sourceMappingURL=privacy.routes.js.map