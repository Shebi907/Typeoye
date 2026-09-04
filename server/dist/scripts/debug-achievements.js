"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const User_1 = __importDefault(require("../models/User"));
const Achievement_1 = __importDefault(require("../models/Achievement"));
const achievement_service_1 = require("../services/achievement.service");
(async () => {
    await mongoose_1.default.connect(env_1.env.MONGODB_URI);
    const user = await User_1.default.findOne({ username: { $regex: /^gt/ } }).sort({ createdAt: -1 });
    if (!user) {
        console.error('no test user found');
        process.exit(1);
    }
    console.log('user:', user.username);
    const count = await Achievement_1.default.countDocuments({ isActive: true });
    console.log('active achievements:', count);
    const records = await (0, achievement_service_1.getUserAchievements)(user._id);
    console.log('records:', Array.isArray(records), records.length);
    console.log('first record keys:', records[0] ? Object.keys(records[0]) : 'n/a');
    console.log('names:', records.map((r) => r.name));
    await mongoose_1.default.disconnect();
})();
//# sourceMappingURL=debug-achievements.js.map