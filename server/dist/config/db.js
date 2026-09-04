"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
/** Strip user:password credentials from a MongoDB URI before logging it so the
 *  database password never leaks into logs. */
function redactUri(uri) {
    try {
        return uri.replace(/\/\/[^@/]+@/, '//***:***@');
    }
    catch {
        return uri;
    }
}
async function connectDB() {
    const maxRetries = 5;
    let retries = 0;
    while (retries < maxRetries) {
        try {
            await mongoose_1.default.connect(env_1.env.MONGODB_URI);
            console.log(`✅ MongoDB connected: ${redactUri(env_1.env.MONGODB_URI)}`);
            mongoose_1.default.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.warn('MongoDB disconnected. Attempting to reconnect...');
            });
            return;
        }
        catch (error) {
            retries += 1;
            console.error(`MongoDB connection attempt ${retries}/${maxRetries} failed:`, error);
            if (retries < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, 2000 * retries));
            }
            else {
                console.error('❌ Could not connect to MongoDB after max retries. Exiting.');
                process.exit(1);
            }
        }
    }
}
//# sourceMappingURL=db.js.map