"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/wpm-trend', auth_middleware_1.authenticate, analytics_controller_1.getWpmTrend);
router.get('/accuracy-trend', auth_middleware_1.authenticate, analytics_controller_1.getAccuracyTrend);
router.get('/weak-keys', auth_middleware_1.authenticate, analytics_controller_1.getWeakKeys);
router.get('/summary', auth_middleware_1.authenticate, analytics_controller_1.getSummary);
router.get('/dashboard', auth_middleware_1.authenticate, analytics_controller_1.getDashboardData);
router.get('/history', auth_middleware_1.authenticate, analytics_controller_1.getHistory);
router.get('/progress', auth_middleware_1.authenticate, analytics_controller_1.getProgress);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map