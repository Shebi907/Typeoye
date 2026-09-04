"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    if (err.type === 'entity.too.large' || err.status === 413) {
        res.status(413).json({ success: false, error: 'Request body too large' });
        return;
    }
    console.error(`[error] ${new Date().toISOString()} ${_req.method} ${_req.originalUrl} -> ${err.status ?? 500}:`, err?.stack || err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'An unexpected server error occurred.',
    });
}
//# sourceMappingURL=errorHandler.middleware.js.map