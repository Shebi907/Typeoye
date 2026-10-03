import dotenv from 'dotenv'; dotenv.config();
import mongoose from 'mongoose';
import TestParagraph from '../models/TestParagraph';
import { PARAGRAPHS } from './paragraphs';
const uri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/typeoye';
const paragraphs = PARAGRAPHS;
async function run() {
  await mongoose.connect(uri);
  const canonical = new Set(paragraphs.map(([, , content]) => content));
  let upserted = 0;
  for (const [difficulty, topic, content] of paragraphs) {
    const res = await TestParagraph.updateOne({ content }, { $set: { difficulty, topic, content } }, { upsert: true });
    if (res.upsertedCount) upserted += 1;
  }
  const removed = await TestParagraph.deleteMany({ content: { $nin: [...canonical] } });
  console.log(`Seeded ${paragraphs.length} test paragraphs (${upserted} new, ${removed.deletedCount} stale removed)`);
  await mongoose.disconnect();
}
run().catch((error) => { console.error(error); process.exit(1); });