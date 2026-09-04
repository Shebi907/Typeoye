"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const typing_controller_1 = require("../controllers/typing.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
router.get('/paragraphs/random', typing_controller_1.getRandomParagraph);
router.post('/sessions', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(typing_controller_1.sessionSchema), typing_controller_1.submitSession);
router.get('/results', auth_middleware_1.authenticate, typing_controller_1.getResults);
router.get('/results/:id', auth_middleware_1.authenticate, typing_controller_1.getResult);
exports.default = router;
//# sourceMappingURL=typing.routes.js.map