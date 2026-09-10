"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const TestParagraph_1 = __importDefault(require("../models/TestParagraph"));
const uri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/typeoye';
const paragraphs = [
    ['beginner', 'nature', 'The sun came up over the hill. A bird sang in the tree. The grass was wet with dew.'],
    ['beginner', 'cooking', 'Maya put the apples in a blue bowl. She cut them into small pieces. Her brother added a pinch of sugar and they shared a snack.'],
    ['beginner', 'travel', 'The small train left the town at dawn. It went past the river and the hills. The day was calm and clear.'],
    ['beginner', 'reading', 'Sam sat by the window with a book. He read about space and stars. The rain fell soft on the road outside.'],
    ['beginner', 'sports', 'Our team ran short passes after school. By sunset, everyone could move the ball well. The coach smiled at the end.'],
    ['beginner', 'pets', 'The puppy sat by the door before every walk. A gentle pat and a kind word made him very happy.'],
    ['beginner', 'weather', 'Clouds came over the town in the afternoon. Then rain washed the road. The sky cleared by night.'],
    ['beginner', 'music', 'Lena played a soft tune on the piano. Her hands moved slow at first. Soon she found the song.'],
    ['beginner', 'school', 'The class put bean seeds in clear cups. Each day they measured the stems. They wrote down what they saw.'],
    ['beginner', 'community', 'Neighbors met at the park to pick up trash. They painted the old benches. The path looked clean and new.'],
    ['beginner', 'market', 'A farmer set out bright carrots on a wooden table. He added tomatoes and lettuce. Shoppers asked where the food was grown.'],
    ['beginner', 'friendship', 'Two friends made a paper kite from sticks and paper. When the wind rose they ran across the field.'],
    ['beginner', 'science', 'Ice melts when it gets heat. The water can freeze again if it gets cold.'],
    ['beginner', 'home', 'Dad fixed the loose drawer by the sink. He used a small tool. Then the kitchen looked clean and neat.'],
    ['beginner', 'art', 'The art club used wide brushes to paint a sunset. Orange and pink filled the paper. The picture hung on the wall.'],
    ['intermediate', 'history', 'Before maps fit inside a phone, sailors relied on stars, compasses, and careful notes. Their journals recorded winds, currents, and landmarks that helped later voyages.'],
    ['intermediate', 'technology', 'A good password is long, unique, and difficult to guess. Password managers make this easier by storing strong credentials without asking people to remember every detail.'],
    ['intermediate', 'health', 'Regular movement improves more than strength. A short walk can clear the mind, support sleep, and create a useful break between demanding tasks.'],
    ['intermediate', 'architecture', 'The bridge uses a pattern of triangles because that shape spreads weight efficiently. Engineers tested the design with models long before construction began.'],
    ['intermediate', 'ocean', 'Coral reefs shelter a remarkable variety of life, yet they are sensitive to warmer water and pollution. Protecting nearby coastlines helps reefs recover after storms.'],
    ['intermediate', 'economics', 'When a local bakery buys flour from a nearby mill, money circulates through several small businesses. Those connections can make a neighborhood more resilient.'],
    ['intermediate', 'language', 'Languages change whenever people borrow ideas, invent tools, or move to new places. Dictionaries describe this change; they do not stop it.'],
    ['intermediate', 'photography', 'Good photographs often depend on patience rather than expensive equipment. Waiting for a cloud to shift can transform ordinary light into something memorable.'],
    ['intermediate', 'gardening', 'Compost turns kitchen scraps and fallen leaves into rich soil over time. The process requires air, moisture, and a balance of green and brown material.'],
    ['intermediate', 'energy', 'Solar panels produce electricity when light reaches their cells, even on many cloudy days. Batteries can store some of that energy for use after sunset.'],
    ['intermediate', 'writing', 'Clear writing begins with a clear purpose. Once a reader understands the main point, examples and details can guide them through the rest of the argument.'],
    ['intermediate', 'wildlife', 'Beavers reshape streams by building dams from branches and mud. The ponds they create provide habitat for fish, birds, insects, and amphibians.'],
    ['intermediate', 'medicine', 'Vaccines train the immune system to recognize a threat before the real infection appears. This preparation can reduce the chance of severe illness.'],
    ['intermediate', 'business', 'A useful meeting ends with decisions, owners, and dates. Without those three things, even an energetic discussion can fade into a list of unfinished ideas.'],
    ['intermediate', 'astronomy', 'Telescopes collect faint light that human eyes cannot see alone. By studying that light, astronomers estimate the distance, motion, and composition of distant objects.'],
    ['advanced', 'climate', 'Climate models do not predict one inevitable future; they compare plausible futures under different assumptions. Their value lies in showing how choices about emissions, land use, and energy can alter long-term risks.'],
    ['advanced', 'psychology', 'Attention is not simply a spotlight that can be aimed without cost. Each interruption imposes a small rebuilding period, which is why sustained work often benefits from deliberate boundaries.'],
    ['advanced', 'law', 'The rule of law depends on procedures being applied consistently, including when the outcome is inconvenient. Public confidence weakens when similar cases appear to receive different standards.'],
    ['advanced', 'biology', 'Evolution is not a ladder of progress but a branching process shaped by selection, chance, and changing environments. Traits persist when they improve reproduction in a particular context.'],
    ['advanced', 'design', 'Accessible design treats variation as ordinary rather than exceptional. Captions, contrast, keyboard navigation, and clear language usually improve an experience for everyone, not only for a narrow group.'],
    ['advanced', 'philosophy', 'A difficult question is not made less important by lacking a quick answer. Careful reasoning can clarify which values are in conflict and what each possible choice would require.'],
    ['advanced', 'computing', 'Distributed systems trade simplicity for resilience. When information is copied across machines, designers must decide how the system behaves while those machines briefly disagree.'],
    ['advanced', 'urbanism', 'A city street serves more than cars moving through it. Sidewalks, trees, transit stops, storefronts, and safe crossings determine whether people can use the space comfortably throughout the day.'],
    ['advanced', 'statistics', 'An average can conceal important differences inside a group. Looking at the distribution, the sample size, and the method of collection often reveals whether a simple summary is misleading.'],
    ['advanced', 'ethics', 'Automation can make a decision faster without making it fairer. Responsible systems identify who bears the cost of mistakes and provide a meaningful way to question an outcome.'],
    ['advanced', 'geology', 'A mountain range records collisions that occurred over millions of years. Folded layers, mineral changes, and displaced faults preserve evidence of pressure far below the present landscape.'],
    ['advanced', 'education', 'Memorization has a role, but durable learning requires retrieval, feedback, and application. Students understand an idea more deeply when they must use it in an unfamiliar setting.'],
    ['advanced', 'economics', 'Prices communicate information, yet they do not capture every consequence of a decision. Clean air, unpaid care, and future damage may be absent from a transaction even when they matter greatly.'],
    ['advanced', 'security', 'Security is a practice of reducing risk, not a promise of perfect safety. Layered defenses, timely updates, and honest incident reviews make failures less likely and less damaging.'],
    ['advanced', 'art', 'A compelling story balances expectation with surprise. Readers need enough structure to follow the path, but enough uncertainty to feel that the next turn matters.'],
];
async function run() {
    await mongoose_1.default.connect(uri);
    const canonical = new Set(paragraphs.map(([, , content]) => content));
    let upserted = 0;
    for (const [difficulty, topic, content] of paragraphs) {
        const res = await TestParagraph_1.default.updateOne({ content }, { $set: { difficulty, topic, content } }, { upsert: true });
        if (res.upsertedCount)
            upserted += 1;
    }
    const removed = await TestParagraph_1.default.deleteMany({ content: { $nin: [...canonical] } });
    console.log(`Seeded ${paragraphs.length} test paragraphs (${upserted} new, ${removed.deletedCount} stale removed)`);
    await mongoose_1.default.disconnect();
}
run().catch((error) => { console.error(error); process.exit(1); });
//# sourceMappingURL=seedTestParagraphs.js.map