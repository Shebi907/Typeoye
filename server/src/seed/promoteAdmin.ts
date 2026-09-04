import mongoose from 'mongoose';
import User from '../models/User';

/**
 * One-time promotion of an existing account to admin.
 *
 * Usage:
 *   EMAIL=you@example.com npm run promote:admin
 *   USERNAME=you npm run promote:admin
 *
 * Promotes the FIRST account matching EMAIL or USERNAME. Regular signup can
 * never set role=admin, so this is the intended path to bootstrap an admin.
 */
async function promote() {
  const email = process.env['EMAIL']?.trim().toLowerCase();
  const username = process.env['USERNAME']?.trim();

  if (!email && !username) {
    console.error('Provide EMAIL=... or USERNAME=... (e.g. EMAIL=you@x.com npm run promote:admin)');
    process.exit(1);
  }

  await mongoose.connect(process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/typeoye');
  const query = email ? { email } : { username };
  const user = await User.findOne(query);

  if (!user) {
    console.error(`No user found for ${email ? `email ${email}` : `username ${username}`}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`"${user.username}" is already an admin.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  user.role = 'admin';
  await user.save();
  console.log(`Promoted "${user.username}" (${user.email}) to admin.`);
  await mongoose.disconnect();
}

promote().catch((err) => {
  console.error('Failed to promote admin:', err);
  process.exit(1);
});