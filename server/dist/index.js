"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const uploads_1 = require("./config/uploads");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const User_1 = __importDefault(require("./models/User"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const lesson_routes_1 = __importDefault(require("./routes/lesson.routes"));
const typing_routes_1 = __importDefault(require("./routes/typing.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const leaderboard_routes_1 = __importDefault(require("./routes/leaderboard.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const practice_routes_1 = __importDefault(require("./routes/practice.routes"));
const games_routes_1 = __importDefault(require("./routes/games.routes"));
const certificate_routes_1 = __importDefault(require("./routes/certificate.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
function createApp() {
    const app = (0, express_1.default)();
    (0, uploads_1.ensureUploadDirs)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: env_1.env.CLIENT_URL,
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '2mb' }));
    app.use((0, morgan_1.default)('dev'));
    // Uploaded content (profile pictures, etc.)
    app.use('/uploads', express_1.default.static(uploads_1.UPLOADS_DIR));
    // Rate limiting
    app.use('/api/auth', rateLimit_middleware_1.authLimiter);
    app.use('/api', rateLimit_middleware_1.apiLimiter);
    // Routes
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/users', user_routes_1.default);
    app.use('/api/lessons', lesson_routes_1.default);
    app.use('/api/typing', typing_routes_1.default);
    app.use('/api/analytics', analytics_routes_1.default);
    app.use('/api/leaderboard', leaderboard_routes_1.default);
    app.use('/api/admin', admin_routes_1.default);
    app.use('/api/practice', practice_routes_1.default);
    app.use('/api/games', games_routes_1.default);
    app.use('/api/certificates', certificate_routes_1.default);
    app.use('/api/contact', contact_routes_1.default);
    // Health check
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // Global error handler (must be last)
    app.use(errorHandler_middleware_1.errorHandler);
    return app;
}
if (require.main === module) {
    // Keep the API alive instead of silently dying on unexpected async failures.
    process.on('unhandledRejection', (reason) => {
        console.error('[process] Unhandled promise rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
        console.error('[process] Uncaught exception:', err);
    });
    process.on('error', (err) => {
        console.error('[process] Error:', err);
    });
    (0, db_1.connectDB)()
        .then(async () => {
        // Safe migration strategy: ensure pre-existing accounts without emailVerified remain verified
        try {
            await User_1.default.updateMany({ emailVerified: { $exists: false } }, { $set: { emailVerified: true } });
        }
        catch (err) {
            console.error('[db] User emailVerified migration error:', err);
        }
        const app = createApp();
        const server = app.listen(env_1.env.PORT, () => {
            console.log(`🚀 Typeoye server running at http://localhost:${env_1.env.PORT}`);
            console.log(`   Environment: ${env_1.env.NODE_ENV}`);
        });
        server.on('error', (err) => {
            console.error(`[server] FAILED to listen on port ${env_1.env.PORT}:`, err);
            process.exit(1);
        });
    })
        .catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map