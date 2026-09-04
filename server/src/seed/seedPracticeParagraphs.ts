import dotenv from 'dotenv'; dotenv.config();
import mongoose from 'mongoose';
import PracticeParagraph from '../models/PracticeParagraph';
const uri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/typeoye';
const paragraphs: Array<[string, string, string]> = [
 ['beginner','daily routines','Before starting work, place both feet on the floor and relax your shoulders. Read a few words ahead, then let your fingers move at a calm and steady pace.'],
 ['beginner','observation','A small notebook can capture useful ideas. Write down a new word, a question, or a detail from the day, then return to it when you need inspiration.'],
 ['beginner','movement','Short breaks help the body reset. Stand up, look away from the screen, and take several slow breaths before beginning another focused practice round.'],
 ['beginner','focus','One clear goal is easier to follow than many vague goals. Choose a skill to improve, practice it slowly, and notice each small success along the way.'],
 ['intermediate','planning','A practical plan balances ambition with available time. Breaking a larger task into brief sessions makes progress visible and leaves room to adjust when priorities change.'],
 ['intermediate','communication','Useful feedback is specific and kind. It identifies what worked, names one place to improve, and gives the other person a clear next step.'],
 ['intermediate','curiosity','Curiosity grows when questions are welcomed. Instead of rushing toward an answer, pause long enough to compare possibilities and examine the evidence.'],
 ['intermediate','craft','Every craft improves through repetition with attention. A musician listens for uneven rhythm, while a typist notices the keys that interrupt a smooth pattern.'],
 ['advanced','systems','Reliable systems are designed for ordinary human mistakes. Clear labels, sensible defaults, and quick recovery paths reduce the cost of an error without hiding its cause.'],
 ['advanced','learning','Expertise is often less about flawless performance than thoughtful correction. People improve fastest when they can identify a pattern, test a change, and observe the result.'],
 ['advanced','collaboration','Strong collaboration depends on shared context. When people state their assumptions and decisions plainly, teammates can contribute earlier and resolve disagreement with less friction.'],
 ['advanced','technology','Digital tools are most helpful when they support judgment rather than replace it. Good interfaces reveal relevant information at the moment a person needs to make a choice.'],
];
async function run() { await mongoose.connect(uri); for (const [difficulty, topic, content] of paragraphs) await PracticeParagraph.updateOne({ content }, { $set: { difficulty, topic, content } }, { upsert: true }); console.log(`Seeded ${paragraphs.length} practice paragraphs`); await mongoose.disconnect(); }
run().catch((error) => { console.error(error); process.exit(1); });