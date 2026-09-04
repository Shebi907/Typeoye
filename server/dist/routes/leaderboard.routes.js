"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboard_controller_1 = require("../controllers/leaderboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Read-only for everyone, including guests. Personal rank ("me") is only
// included when a valid token is present (optional auth).
router.get('/', auth_middleware_1.optionalAuthenticate, leaderboard_controller_1.getLeaderboard);
exports.default = router;
//# sourceMappingURL=leaderboard.routes.js.map