"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
(async () => {
    await mongoose_1.default.connect(env_1.env.MONGODB_URI);
    const user = await User_1.default.findOne({ username: { $regex: /^gt/ } }).sort({ createdAt: -1 });
    if (!user) {
        console.error('no test user');
        process.exit(1);
    }
    const token = (0, jwt_1.signToken)(user._id.toString());
    const res = await fetch(`http://localhost:${env_1.env.PORT}/api/users/me/achievements`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json());
    console.log('status:', res.status);
    console.log('body keys:', Object.keys(body));
    console.log('data is array?', Array.isArray(body.data));
    if (body.data)
        console.log('data keys:', Object.keys(body.data));
    if (body.data?.achievements)
        console.log('achievements is array?', Array.isArray(body.data.achievements), body.data.achievements.length);
    console.log('raw:', JSON.stringify(body).slice(0, 600));
    await mongoose_1.default.disconnect();
})();
//# sourceMappingURL=debug-endpoint.js.map