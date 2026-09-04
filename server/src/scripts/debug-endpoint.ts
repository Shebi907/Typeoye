import mongoose from 'mongoose';
import { env } from '../config/env';
import User from '../models/User';
import { signToken } from '../utils/jwt';

(async () => {
  await mongoose.connect(env.MONGODB_URI);
  const user = await User.findOne({ username: { $regex: /^gt/ } }).sort({ createdAt: -1 });
  if (!user) { console.error('no test user'); process.exit(1); }
  const token = signToken(user._id.toString());
  const res = await fetch(`http://localhost:${env.PORT}/api/users/me/achievements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await res.json()) as Record<string, any>;
  console.log('status:', res.status);
  console.log('body keys:', Object.keys(body));
  console.log('data is array?', Array.isArray(body.data));
  if (body.data) console.log('data keys:', Object.keys(body.data));
  if (body.data?.achievements) console.log('achievements is array?', Array.isArray(body.data.achievements), body.data.achievements.length);
  console.log('raw:', JSON.stringify(body).slice(0, 600));
  await mongoose.disconnect();
})();
