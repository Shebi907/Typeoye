"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lesson_controller_1 = require("../controllers/lesson.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
// Course content is public (guests can browse lessons); only saving an
// exercise completion requires an account. Optional auth keeps progress
// unlocked/status computed from the signed-in user when a token is present.
router.get('/', auth_middleware_1.optionalAuthenticate, lesson_controller_1.getLessons);
router.get('/:id', auth_middleware_1.optionalAuthenticate, lesson_controller_1.getLesson);
router.post('/:id/exercises/:exerciseId/complete', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(lesson_controller_1.completeExerciseSchema), lesson_controller_1.completeExercise);
exports.default = router;
//# sourceMappingURL=lesson.routes.js.map