"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
exports.requireAdmin = requireAdmin;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await User_1.default.findById(decoded.userId).select('-passwordHash');
        if (!user) {
            res.status(401).json({ success: false, error: 'User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}
/**
 * Attaches `req.user` when a valid token is present, but never fails the
 * request — public/guest endpoints use this so signed-in visitors still get
 * personalization (progress, weak keys, "me" rows) while guests are allowed in.
 */
async function optionalAuthenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await User_1.default.findById(decoded.userId).select('-passwordHash');
        if (user)
            req.user = user;
    }
    catch {
        // Invalid/expired token — treat as guest.
    }
    next();
}
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map