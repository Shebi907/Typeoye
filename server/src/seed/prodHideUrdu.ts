import mongoose from 'mongoose';

// Reversible production fix: hide the 16 Urdu lessons (and their exercises) from
// the OLD deployed production code, which lists `Lesson.find({ isActive: true })`
// with no language filter. Nothing is deleted; setting isActive:true again fully
// restores them.
const ATLAS_URI = 'mongodb+srv://typeoyeofficial_db_user:YrVRbidVle2Hpwsf@cluster0.q0ms6yt.mongodb.net/typeoye?retryWrites=true&w=majority&appName=Cluster0';

const MODE = process.argv[2] === 'restore' ? 'restore' : 'hide';

async function run(): Promise<void> {
  await mongoose.connect(ATLAS_URI);
  const db = mongoose.connection.db!;
  console.log('Connected to DB:', mongoose.connection.name, '| mode:', MODE);

  const ur = await db.collection('lessons').find({ language: 'ur' }).project({ _id: 1, order: 1, title: 1, isActive: 1 }).toArray();
  const ids = ur.map((d) => d._id);
  console.log('UR lessons found:', ur.length);

  const desired = MODE === 'hide' ? false : true;
  const lessonRes = await db.collection('lessons').updateMany({ language: 'ur' }, { $set: { isActive: desired } });
  const exRes = await db.collection('exercises').updateMany({ lessonId: { $in: ids } }, { $set: { isActive: desired } });
  console.log(`lessons modified: ${lessonRes.modifiedCount}, exercises modified: ${exRes.modifiedCount} (isActive -> ${desired})`);

  const enActive = await db.collection('lessons').countDocuments({ language: 'en', isActive: true });
  const urActive = await db.collection('lessons').countDocuments({ language: 'ur', isActive: true });
  const totalActive = await db.collection('lessons').countDocuments({ isActive: true });
  console.log('after -> en active:', enActive, '| ur active:', urActive, '| total active (what old prod API returns):', totalActive);

  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
