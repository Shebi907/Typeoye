"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const User_1 = __importDefault(require("../models/User"));
/**
 * One-time migration helper: deletes every user EXCEPT the admin account(s).
 * Use this to purge pre-recovery test accounts before rollout.
 *
 * Run: npx ts-node server/src/scripts/cleanupUsers.ts
 */
(async () => {
    await mongoose_1.default.connect(env_1.env.MONGODB_URI);
    const adminCount = await User_1.default.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
        console.error('Aborting: no admin user found. Kept everyone to stay safe.');
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
    const result = await User_1.default.deleteMany({ role: { $ne: 'admin' } });
    console.log(`Deleted ${result.deletedCount} non-admin user(s). Kept ${adminCount} admin account(s).`);
    await mongoose_1.default.disconnect();
})();
//# sourceMappingURL=cleanupUsers.js.map