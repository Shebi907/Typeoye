"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
const avatarSchema = zod_1.z.object({ dataUrl: zod_1.z.string().min(1, 'Image data is required') });
router.get('/:id/profile', user_controller_1.getProfile);
router.patch('/settings', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(user_controller_1.updateSettingsSchema), user_controller_1.updateSettings);
router.get('/me/achievements', auth_middleware_1.authenticate, user_controller_1.getAchievements);
router.post('/me/avatar', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(avatarSchema), user_controller_1.updateAvatar);
router.delete('/me/avatar', auth_middleware_1.authenticate, user_controller_1.removeAvatar);
router.post('/me/password', auth_middleware_1.authenticate, rateLimit_middleware_1.changePasswordLimiter, (0, validate_middleware_1.validate)(user_controller_1.changePasswordSchema), user_controller_1.changePassword);
exports.default = router;
//# sourceMappingURL=user.routes.js.map