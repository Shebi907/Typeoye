"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const games_controller_1 = require("../controllers/games.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
router.get('/history', auth_middleware_1.authenticate, games_controller_1.getGameHistory);
router.post('/complete', auth_middleware_1.optionalAuthenticate, (0, validate_middleware_1.validate)(games_controller_1.gameSchema), games_controller_1.completeGame);
exports.default = router;
//# sourceMappingURL=games.routes.js.map