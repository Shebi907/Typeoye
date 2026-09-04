import mongoose from 'mongoose';
import { env } from '../config/env';
import User from '../models/User';
import Achievement from '../models/Achievement';
import { getUserAchievements } from '../services/achievement.service';

(async () => {
  await mongoose.connect(env.MONGODB_URI);
  const user = await User.findOne({ username: { $regex: /^gt/ } }).sort({ createdAt: -1 });
  if (!user) { console.error('no test user found'); process.exit(1); }
  console.log('user:', user.username);
  const count = await Achievement.countDocuments({ isActive: true });
  console.log('active achievements:', count);
  const records = await getUserAchievements(user._id);
  console.log('records:', Array.isArray(records), records.length);
  console.log('first record keys:', records[0] ? Object.keys(records[0]) : 'n/a');
  console.log('names:', records.map((r) => (r as any).name));
  await mongoose.disconnect();
})();
