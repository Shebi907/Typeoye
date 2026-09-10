"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const User_1 = __importDefault(require("../models/User"));
const Profile_1 = __importDefault(require("../models/Profile"));
/**
 * One-time backfill: assign `authProvider` to legacy user documents that were
 * created before `authProvider` existed in the schema (it had no marker at all).
 *
 * Classification (only for documents MISSING the field — existing values are
 * never touched):
 *   - 'google' when the account was created through the Google OAuth flow.
 *     Evidence: the linked Profile stores Google's hosted picture
 *     (lh3/lh4/...googleusercontent.com). Only the Google callback sets that;
 *     locally uploaded avatars live under /uploads/avatars/.
 *   - 'local' otherwise (manual email/password accounts).
 *
 * Safe and idempotent: documents that already have authProvider are skipped.
 *
 * Run (dry-run first):
 *   npx ts-node server/src/scripts/backfillAuthProvider.ts --dry-run
 *   npx ts-node server/src/scripts/backfillAuthProvider.ts
 */
(async () => {
    const dryRun = process.argv.includes('--dry-run');
    await mongoose_1.default.connect(env_1.env.MONGODB_URI);
    const legacy = await User_1.default.find({ authProvider: { $exists: false } });
    if (legacy.length === 0) {
        console.log('No users missing authProvider — nothing to backfill.');
        await mongoose_1.default.disconnect();
        return;
    }
    const googleAvatar = /^https?:\/\/(lh\d\.|storage\.)?googleusercontent\.com\//i;
    const plans = [];
    for (const user of legacy) {
        const profile = await Profile_1.default.findOne({ userId: user._id });
        const isGoogle = !!profile?.avatarUrl && googleAvatar.test(profile.avatarUrl) && profile.avatarUrl.startsWith('http');
        plans.push({
            email: user.email,
            username: user.username,
            authProvider: isGoogle ? 'google' : 'local',
            reason: isGoogle ? `Google-created (avatar ${profile?.avatarUrl})` : `manual (no Google avatar: ${profile?.avatarUrl ?? 'none'})`,
        });
    }
    for (const p of plans) {
        console.log(`${dryRun ? '[dry-run] would set' : '[apply] setting'} authProvider=${p.authProvider}  ${p.email} (${p.username}) — ${p.reason}`);
    }
    if (!dryRun) {
        for (const user of legacy) {
            const plan = plans.find((p) => p.email === user.email);
            if (!plan)
                continue;
            user.authProvider = plan.authProvider;
            await user.save();
        }
        console.log(`Backfilled ${plans.length} user(s).`);
    }
    await mongoose_1.default.disconnect();
})().catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
//# sourceMappingURL=backfillAuthProvider.js.map