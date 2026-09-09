import mongoose from 'mongoose';
import { env } from '../config/env';
import User from '../models/User';
import Profile from '../models/Profile';

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

  await mongoose.connect(env.MONGODB_URI);

  const legacy = await User.find({ authProvider: { $exists: false } });
  if (legacy.length === 0) {
    console.log('No users missing authProvider — nothing to backfill.');
    await mongoose.disconnect();
    return;
  }

  const googleAvatar = /^https?:\/\/(lh\d\.|storage\.)?googleusercontent\.com\//i;

  const plans: Array<{ email: string; username: string; authProvider: 'local' | 'google'; reason: string }> = [];
  for (const user of legacy) {
    const profile = await Profile.findOne({ userId: user._id });
    const isGoogle =
      !!profile?.avatarUrl && googleAvatar.test(profile.avatarUrl) && profile.avatarUrl.startsWith('http');
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
      if (!plan) continue;
      user.authProvider = plan.authProvider;
      await user.save();
    }
    console.log(`Backfilled ${plans.length} user(s).`);
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});