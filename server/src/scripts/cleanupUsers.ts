import mongoose from 'mongoose';
import { env } from '../config/env';
import User from '../models/User';

/**
 * One-time migration helper: deletes every user EXCEPT the admin account(s).
 * Use this to purge pre-recovery test accounts before rollout.
 *
 * Run: npx ts-node server/src/scripts/cleanupUsers.ts
 */
(async () => {
  await mongoose.connect(env.MONGODB_URI);

  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount === 0) {
    console.error('Aborting: no admin user found. Kept everyone to stay safe.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const result = await User.deleteMany({ role: { $ne: 'admin' } });
  console.log(`Deleted ${result.deletedCount} non-admin user(s). Kept ${adminCount} admin account(s).`);

  await mongoose.disconnect();
})();
