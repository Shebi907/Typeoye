"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const practice_controller_1 = require("../controllers/practice.controller");
const router = (0, express_1.Router)();
// Word generation is open so guests can practice; overview uses the
// authenticated user's weak-key profile and recent results. Optional auth on
// generate lets signed-in users keep their weak-key/set personalization.
router.get('/overview', auth_middleware_1.authenticate, practice_controller_1.getPracticeOverview);
router.get('/generate', auth_middleware_1.optionalAuthenticate, practice_controller_1.generatePractice);
exports.default = router;
//# sourceMappingURL=practice.routes.js.map