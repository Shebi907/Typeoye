"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const Lesson_1 = __importDefault(require("../models/Lesson"));
const Exercise_1 = __importDefault(require("../models/Exercise"));
const Achievement_1 = __importDefault(require("../models/Achievement"));
const TestParagraph_1 = __importDefault(require("../models/TestParagraph"));
const UserAchievement_1 = __importDefault(require("../models/UserAchievement"));
const LessonProgress_1 = __importDefault(require("../models/LessonProgress"));
const lessonContent_service_1 = require("../services/lessonContent.service");
const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/typeoye';
async function seed() {
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    // Clear existing data
    await Promise.all([
        Lesson_1.default.deleteMany({}),
        Exercise_1.default.deleteMany({}),
        Achievement_1.default.deleteMany({}),
        TestParagraph_1.default.deleteMany({}),
        // Progress references exercise ids that no longer exist after a reseed.
        LessonProgress_1.default.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing seed data');
    // --- REAL TYPING TEST PARAGRAPHS ---
    const paragraphs = [
        ['beginner', 'nature', 'Morning light warmed the garden while bees moved from flower to flower. A robin landed on the fence, paused, and flew toward the old oak tree.'],
        ['beginner', 'cooking', 'Maya washed the apples, sliced them thin, and placed them in a blue bowl. Her brother added cinnamon before they shared the simple snack.'],
        ['beginner', 'travel', 'The small train left the station at dawn and followed the river through green hills. Passengers watched mist lift slowly from the water.'],
        ['beginner', 'reading', 'At the library, Sam chose a book about space and found a quiet chair by the window. He read until the rain stopped.'],
        ['beginner', 'sports', 'Our team practiced short passes after school. By sunset, everyone could move the ball quickly and call for help with confidence.'],
        ['beginner', 'pets', 'The puppy learned to sit beside the door before every walk. A gentle pat and a kind word made training feel like a game.'],
        ['beginner', 'weather', 'Clouds gathered over the town in the afternoon. Then a cool rain washed the streets and left bright puddles on the sidewalk.'],
        ['beginner', 'music', 'Lena played a soft tune on the piano each evening. Her hands moved slowly at first, then found the rhythm of the song.'],
        ['beginner', 'school', 'The class planted bean seeds in clear cups. Each day they measured the stems and wrote down what had changed.'],
        ['beginner', 'community', 'Neighbors met at the park to pick up litter and paint the old benches. The clean path felt welcoming when the work was done.'],
        ['beginner', 'market', 'A farmer arranged bright carrots, tomatoes, and lettuce on a wooden table. Shoppers asked where the food was grown.'],
        ['beginner', 'friendship', 'Two friends built a paper kite from light sticks and colored tissue. When the wind rose, they ran across the field together.'],
        ['beginner', 'science', 'Ice melts when it receives heat. The water can later freeze again if the temperature falls below zero.'],
        ['beginner', 'home', 'Dad fixed the loose drawer with a small screwdriver. Afterward, the kitchen felt calmer because everything had a place.'],
        ['beginner', 'art', 'The art club used wide brushes to paint a sunset. Orange, pink, and purple blended across the paper.'],
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
    ].map(([difficulty, topic, content]) => ({ difficulty, topic, content }));
    await TestParagraph_1.default.insertMany(paragraphs);
    console.log(`✅ Seeded ${paragraphs.length} varied typing-test paragraphs`);
    // --- ACHIEVEMENTS (All 14 Required) ---
    const achievements = await Achievement_1.default.insertMany([
        {
            name: 'First Test',
            description: 'Complete 3 full typing tests - starting or opening a test does not count.',
            icon: '🎯',
            condition: { type: 'first_test', threshold: 3 },
            xpReward: 50,
            rarity: 'common',
        },
        {
            name: 'First Practice',
            description: 'Complete 5 practice sessions.',
            icon: '📝',
            condition: { type: 'practice', threshold: 5 },
            xpReward: 50,
            rarity: 'common',
        },
        {
            name: 'Reach 25 WPM',
            description: 'Reach 25 WPM in a single test with at least 90% accuracy.',
            icon: '🐢',
            condition: { type: 'wpm', threshold: 25 },
            params: { minAccuracy: 90 },
            xpReward: 50,
            rarity: 'common',
        },
        {
            name: 'Reach 40 WPM',
            description: 'Reach 40 WPM in a single test with at least 90% accuracy.',
            icon: '🚀',
            condition: { type: 'wpm', threshold: 40 },
            params: { minAccuracy: 90 },
            xpReward: 75,
            rarity: 'common',
        },
        {
            name: 'Speed Demon',
            description: 'Reach 60 WPM in a single 60+ second test with at least 92% accuracy.',
            icon: '⚡',
            condition: { type: 'wpm', threshold: 60 },
            params: { minAccuracy: 92, minDuration: 60 },
            xpReward: 100,
            rarity: 'rare',
        },
        {
            name: 'Reach 80 WPM',
            description: 'Reach 80 WPM in a single 60+ second test with at least 93% accuracy.',
            icon: '🔥',
            condition: { type: 'wpm', threshold: 80 },
            params: { minAccuracy: 93, minDuration: 60 },
            xpReward: 200,
            rarity: 'epic',
        },
        {
            name: 'Lightning Fast',
            description: 'Reach 100 WPM in a 60+ second test with at least 95% accuracy, in 3 separate tests.',
            icon: '🌩️',
            condition: { type: 'wpm', threshold: 100 },
            params: { minAccuracy: 95, minDuration: 60, requiredTests: 3 },
            xpReward: 350,
            rarity: 'legendary',
        },
        {
            name: '95% Accuracy',
            description: 'Reach 95% accuracy in a single test while typing at least 40 WPM.',
            icon: '🎯',
            condition: { type: 'accuracy', threshold: 95 },
            params: { minWpm: 40 },
            xpReward: 75,
            rarity: 'common',
        },
        {
            name: '99% Accuracy',
            description: 'Reach 99% accuracy in a single test while typing at least 50 WPM.',
            icon: '🎯',
            condition: { type: 'accuracy', threshold: 99 },
            params: { minWpm: 50 },
            xpReward: 150,
            rarity: 'rare',
        },
        {
            name: 'Perfect Test',
            description: 'Achieve 100% accuracy while typing at least 50 WPM for 60+ seconds, in 2 separate tests.',
            icon: '💎',
            condition: { type: 'accuracy', threshold: 100 },
            params: { minWpm: 50, minDuration: 60, requiredTests: 2 },
            xpReward: 250,
            rarity: 'epic',
        },
        {
            name: '7 Day Streak',
            description: 'Complete a typing test or practice session 7 days in a row.',
            icon: '🔥',
            condition: { type: 'streak', threshold: 7 },
            xpReward: 150,
            rarity: 'rare',
        },
        {
            name: '30 Day Streak',
            description: 'Complete a typing test or practice session 30 days in a row.',
            icon: '🏆',
            condition: { type: 'streak', threshold: 30 },
            xpReward: 500,
            rarity: 'legendary',
        },
        {
            name: 'Complete First 3 Lessons',
            description: 'Complete your first 3 learning lessons, each with at least 90% accuracy.',
            icon: '📚',
            condition: { type: 'lesson', threshold: 3 },
            xpReward: 50,
            rarity: 'common',
        },
        {
            name: 'Complete 10 Lessons',
            description: 'Complete 10 learning lessons, each with at least 90% accuracy.',
            icon: '🎓',
            condition: { type: 'lesson', threshold: 10 },
            xpReward: 400,
            rarity: 'epic',
        },
    ]);
    console.log(`✅ Seeded ${achievements.length} achievements`);
    // Remove unlocks that point at achievements no longer in the catalog
    const activeIds = await Achievement_1.default.find({}).select('_id');
    await UserAchievement_1.default.deleteMany({ achievementId: { $nin: activeIds } });
    // --- 16 LEARN LEVELS (Foundation → Building Blocks → Flow & Rhythm → Advanced)
    // Exercise base content mirrors variant[0] of each pool in
    // services/lessonContent.service.ts so the fallback always matches.
    const curriculum = [
        { title: 'Keyboard Basics', category: 'foundation', description: 'Learn the QWERTY layout, relaxed hand position, spacebar, backspace, and shift.', targetKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], difficulty: 1 },
        { title: 'Home Row', category: 'foundation', description: 'Build a steady home position with A S D F and J K L semicolon.', targetKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], difficulty: 1 },
        { title: 'Top Row', category: 'foundation', description: 'Reach the Q W E R T and Y U I O P keys without losing your home position.', targetKeys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], difficulty: 2 },
        { title: 'Bottom Row', category: 'foundation', description: 'Practice smooth, accurate reaches to Z X C V B and N M.', targetKeys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'], difficulty: 2 },
        { title: 'Number Row', category: 'foundation', description: 'Stretch up to the number row and type digits without looking down.', targetKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], difficulty: 3 },
        { title: 'Common Bigrams', category: 'building-blocks', description: 'Make frequent two-letter combos like th, er, and in feel automatic.', targetKeys: ['t', 'h', 'e', 'r', 'i', 'n'], difficulty: 3 },
        { title: 'Common Trigrams', category: 'building-blocks', description: 'Type three-letter patterns like ing, the, and and with a steady rhythm.', targetKeys: ['i', 'n', 'g', 't', 'h', 'e'], difficulty: 4 },
        { title: 'Short Words', category: 'building-blocks', description: 'Build speed on three- and four-letter words you use every day.', targetKeys: [], difficulty: 4 },
        { title: 'Common Words', category: 'building-blocks', description: 'Master the high-frequency words that make up most everyday text.', targetKeys: [], difficulty: 5 },
        { title: 'Longer Words', category: 'building-blocks', description: 'Handle multi-syllable and complex vocabulary without losing rhythm.', targetKeys: [], difficulty: 5 },
        { title: 'Short Sentences', category: 'flow-rhythm', description: 'Carry smooth timing across short, complete sentences.', targetKeys: [], difficulty: 6 },
        { title: 'Punctuation Basics', category: 'flow-rhythm', description: 'Add commas, periods, question marks, and exclamation points cleanly.', targetKeys: [',', '.', '?', '!'], difficulty: 6 },
        { title: 'Full Sentences', category: 'flow-rhythm', description: 'Type full sentences with mixed punctuation at a controlled pace.', targetKeys: [], difficulty: 7 },
        { title: 'Paragraphs', category: 'flow-rhythm', description: 'Practice connected ideas across complete paragraphs.', targetKeys: [], difficulty: 7 },
        { title: 'Numbers & Symbols in Context', category: 'advanced', description: 'Type real-world text mixing figures, currency, dates, and symbols.', targetKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '$', '%', '#', '@'], difficulty: 8 },
        { title: 'Advanced Typing', category: 'advanced', description: 'Combine capitalization, code-like text, and professional documents.', targetKeys: [], difficulty: 9 },
    ];
    const learnLessons = await Lesson_1.default.insertMany(curriculum.map((lesson, index) => ({ ...lesson, order: index + 1, accuracyThreshold: 90, isActive: true })));
    // Exercise sets: 3 exercises for L1-5, 4 exercises for L6-14, 5 exercises for L15-16
    const exerciseSets = [
        // Level 1: Keyboard Basics (3 exercises)
        [
            ['Key positions', 'keys', 'ff jj ff jj dd kk ss ll aa ;; ff jj ff jj dd kk ss ll aa ;; fj fj dk dk sl sl a; a; fj fj dk dk sl sl a; a; fj fj dk dk sl sl', ['a', 's', 'd', 'f', 'j', 'k', 'l', ';']],
            ['Space and shift', 'sentences', 'Rest your fingers lightly on the home keys. Tap the spacebar with your right thumb. Return each finger to its resting place after every reach.', [' ']],
            ['Key combination patterns', 'keys', 'ad jk ad jk ad jk fj fj ad jk fj fj ad jk fj fj ad jk fj fj as jk as jk ;l as ;l ;l as as jk ;l as as jk', ['a', 's', 'd', 'f', 'j', 'k', 'l', ';']],
        ],
        // Level 2: Home Row (3 exercises)
        [
            ['Home row rhythm', 'keys', 'asdf jkl; asdf jkl; asdf jkl; fjdk fjdk slaj asdf jkl; asdf jkl; fjdk fjdk sl;a sl;a fjdk fjdk ;als ;als asdf jkl; fjdk sl;a', ['a', 's', 'd', 'f', 'j', 'k', 'l', ';']],
            ['Home row words', 'words', 'all ask dad fall flask glad half hall had sad dash lad lass adds salad flask falls glad dad half ask lass adds dash had hall all', ['a', 's', 'd', 'f', 'j', 'k', 'l', ';']],
            ['Home row short phrases', 'sentences', 'A glad dad had a sad lad fall. The flask was half full. Dad asked all lads to add salad. Glass shards fell from the hall shelf.', ['a', 's', 'd', 'f', 'j', 'k', 'l', ';']],
        ],
        // Level 3: Top Row (3 exercises)
        [
            ['Top row reaches', 'keys', 'qwer tyui op qwer tyui op qwer tyui qwer tyui op qwer tyui op qwer tyui op we rt yu io we rt yu io ew tr uy oi we rt yu io ew tr', ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']],
            ['Top row words', 'words', 'type write quiet power route proper your wire tower quote peer riot port trip tour pour poetry output torque puppet wept reporter', ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']],
            ['Top row mixed drills', 'keys', 'qwer qwer tyui tyui op op qwer tyui op qwer tyui op tyui qwer op qwer tyui op tyui qwer op qwer tyui op qwer tyui op qwer tyui op', ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']],
        ],
        // Level 4: Bottom Row (3 exercises)
        [
            ['Bottom row reaches', 'keys', 'zxcv bnm zxcv bnm zxcv bnm mnb vcxz zxcv bnm mnb vcxz zxcv bnm mnb vcxz zxcv bnm mnb vcxz zx cv bn m zx cv bn m xz vc nb', ['z', 'x', 'c', 'v', 'b', 'n', 'm']],
            ['Bottom row words', 'words', 'zinc calm brave venom exact comic cabin maximum buzz jazz maze zone climb crumb bench bunch blend brand comb numb lamb bacon vacuum', ['z', 'x', 'c', 'v', 'b', 'n', 'm']],
            ['Bottom row sentences', 'sentences', 'A calm zinc cabin blends with the brave venom of the blazing maximum buzz. Jazz maze zones climb above the crumb bench with exact comic actions.', ['z', 'x', 'c', 'v', 'b', 'n', 'm']],
        ],
        // Level 5: Number Row (3 exercises)
        [
            ['Number drills', 'custom', '1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 0 9 8 7 6 5 4 3 2 1 0 9 8 7 6 1 2 3 4 5 6 7 8 9 0 0 9 8 7 6 5 4 3 2 1 0 9 8 7 6', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']],
            ['Numbers in context', 'sentences', 'There are 10 apples in the basket and 5 oranges on the shelf by the window. The children ate 3 apples before lunch and saved the rest for later.', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']],
            ['Number drills with mixed patterns', 'custom', '1st 2nd 3rd 4th 5th 6th 7th 8th 9th 10th 11th 12th 13th 14th 15th 16th 17th 18th 19th 20th 21st 22nd 23rd 24th 25th 26th 27th 28th 29th 30th', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']],
        ],
        // Level 6: Common Bigrams (4 exercises)
        [
            ['Bigram drills', 'keys', 'th th th he he he er er er in in in an an an re re re on on on at at at en en en nd nd nd th th th he he he er er er in in in an an an', ['t', 'h', 'e', 'r', 'i', 'n']],
            ['Bigram combo words', 'words', 'then them their there other another rather gather father mother brother then them their there other another rather gather father mother brother', ['t', 'h', 'e', 'r', 'i', 'n']],
            ['Bigram-rich sentences', 'sentences', 'The mother gathered her brother and father into the shed when the storm entered the valley. Another wave thundered through the stone entrance and the light trembled inside.', ['t', 'h', 'e', 'r', 'i', 'n']],
            ['Bigram paragraphs', 'paragraph', 'The other children entered the weather shelter rather than stand along the exposed shore. Their father gathered the anchor while their mother told them to gather their things. Another wave thundered through the stone archway and rattled the wooden panels inside. The entire family huddled together and waited for the storm to enter its final phase before they headed back outside to the island.', ['t', 'h', 'e', 'r', 'i', 'n']],
        ],
        // Level 7: Common Trigrams (4 exercises)
        [
            ['Trigram drills', 'keys', 'ing ing ing tion tion tion ment ment ment able able able ness ness ness ough ough ough ight ight ight ing ing ing tion tion tion ment ment', ['i', 'n', 'g', 't', 'h', 'e']],
            ['Trigram pattern words', 'words', 'thinking reading meaning bringing singing ringing clinging stinging belonging thinking reading meaning bringing singing ringing clinging stinging', ['i', 'n', 'g']],
            ['Trigram sentences', 'sentences', 'The station master mentioned that the train arrived on time despite the lightning storm that brought trees down along the northern section of the track.', ['i', 'n', 'g', 't', 'h', 'e']],
            ['Trigram paragraphs', 'paragraph', 'The management department mentioned a treatment agreement that brought the station payment to the thinking reader. The statement included the treatment mentioned at the appointment. The department brought the station agreement along with the payment mentioned in the statement. The reading reader brought the thinking statement to the station. The treatment was mentioned at the management department station appointment.', ['i', 'n', 'g', 't', 'h', 'e']],
        ],
        // Level 8: Short Words (4 exercises)
        [
            ['Three-letter words', 'words', 'cat dog run hop sit big red hot cup pan win ago but try use age bit dip end fit the and for you was are his how our not but can say had get', []],
            ['Four-letter words', 'words', 'calm dark each face game hard into just keep life made note open path quit rest safe time used view walk year zero back call dark each face game', []],
            ['Five-letter words', 'words', 'apple brain coach diary email first globe happy image jewel knife lemon model night often phase quiet robot smoke trace under video women young zero', []],
            ['Mixed short words in sentences', 'sentences', 'The calm dog ran across the dark field and jumped the tall fence near the old red barn. It sat beside the gate and watched the birds fly past.', []],
        ],
        // Level 9: Common Words (4 exercises)
        [
            ['High-frequency everyday words A', 'words', 'the and you that have for not with this they from what about would which when make people time know take year your good some could them see other than then now look', []],
            ['Everyday compound sentences', 'sentences', 'The morning light came through the window and fell on the small basket beside the garden gate. A gentle breeze carried the scent of coffee from the open kitchen door, and the yellow flowers in the corner swayed beneath the silver clouds that drifted above the village bridge.', []],
            ['Common word paragraphs A', 'paragraph', 'Every morning the family gathered at the table for a simple dinner of bread and coffee before heading to the market across the village. The garden beside the window was yellow with autumn flowers, and the meadow beyond the forest bridge shone silver in the early light. Their friend carried a basket of candles and a golden carpet, and the shadow of the lantern fell gentle and frozen on the pillow by the door. The motion of the morning was a signal that the harbor of home was always worth the travel.', []],
            ['Common word paragraphs B', 'paragraph', 'The family found a simple village where the morning garden held yellow flowers and the forest beyond the bridge hummed with quiet motion. They set their basket down beside the meadow and watched the silver light fall through the window of every cottage. The dinner that evening was a golden circle of candles, carpet, and gentle conversation, and the shadow of the lantern on the pillow told them this was a place worth remembering. The harbor of the evening sky held them all.', []],
        ],
        // Level 10: Longer Words (4 exercises)
        [
            ['Multi-syllable words', 'words', 'beautiful important different government community experience information development environment national political organization opportunity international professional performance management relationship technology communication administration particular understand significant independent television population', []],
            ['Complex vocabulary words', 'words', 'architecture equilibrium perspective necessary responsibility phenomenon questionnaire rhythm labyrinth hypothesis bureaucracy entrepreneur conscientious acknowledge surveillance negotiate threshold symmetry paradigm discrepancy approximately extraordinary collaborate consequently sophisticated predominantly accumulate circumstances infrastructure preliminary simultaneously', []],
            ['Academic vocabulary sentences', 'sentences', 'The methodology requires careful calibration before each experiment. Participants were selected through a rigorous screening process that examined demographic factors, prior experience levels, and baseline performance metrics. The research team documented every variable with precision, ensuring that the data collected would withstand scrutiny from peer reviewers who would later evaluate the validity of the conclusions drawn from this comprehensive study.', []],
            ['Academic vocabulary paragraphs', 'paragraph', 'The research methodology employed a mixed-methods approach that combined quantitative survey data with qualitative interview transcripts from 120 participants across six demographic categories. Statistical analysis revealed a strong correlation between professional development opportunities and employee retention rates, with a confidence interval of 95 percent. The researchers acknowledged several limitations, including potential sampling bias in the self-selected volunteer pool and the difficulty of establishing causal relationships from cross-sectional data collected at a single point in time.', []],
        ],
        // Level 11: Short Sentences (4 exercises)
        [
            ['Calm action phrases', 'sentences', 'Good posture supports calm typing. Keep your wrists low and your shoulders relaxed. Daily practice builds muscle memory. Start each session with a slow warm-up drill. Small goals lead to steady progress. Choose one weak key each day to focus on. Clean rhythm matters more than speed. Let your accuracy guide your pace forward.', []],
            ['Motivational phrases', 'sentences', 'Every great typist once made the same errors you are making right now. Keep going. The keyboard is a tool, not an obstacle. With time, it becomes an extension of your mind. Progress is rarely visible day to day. Look back a week and you will see how far you came. Speed arrives as a side effect of comfort. Stop chasing it and it will find you naturally.', []],
            ['Business and workplace phrases', 'sentences', 'Clear communication saves time and reduces confusion in every team. A well-written email is worth a dozen follow-up meetings. Always state the purpose in the first sentence so the reader knows exactly what is expected. Deadlines matter because they create structure and accountability. When everyone understands the timeline, projects move forward smoothly and without unnecessary delays.', []],
            ['Personal development sentences', 'sentences', 'Growth happens at the edge of your comfort zone, not in the center of it. The moments when you feel most uncertain are often the moments when you are learning the most. Embrace the discomfort because it signals that something new is being integrated into your understanding of the world.', []],
        ],
        // Level 12: Punctuation Basics (4 exercises)
        [
            ['Commas and periods', 'sentences', 'She packed her bag, locked the door, and walked to the bus stop in the cool morning air. The soup was warm, the bread was fresh, and the table was set by the time guests arrived. He opened the window, looked outside, and decided it was finally a good day for a walk.', [',', '.']],
            ['Question marks and exclamation points', 'sentences', 'Where did you leave the keys? I checked the table, the drawer, and the coat pocket by the door. Did you remember to water the plants? They looked a little dry when I passed them this morning. How long has it been raining? The street looks completely flooded from where I am standing.', ['?', '!', '.']],
            ['Semicolons and colons', 'sentences', 'The museum was closed; the gates were locked; and a small sign announced the renovation schedule. She brought three things to the picnic: a blanket, a basket of sandwiches, and a thermos of cold lemonade. He knew exactly what he wanted; he had planned it for weeks; and nothing was going to change his mind.', [';', ':', '.']],
            ['Mixed punctuation sentences', 'sentences', '"Did you finish the report?" she asked. He nodded, closed his laptop, and headed to the meeting. "Excellent," she replied. "The client will be pleased." The results were impressive: revenue grew by 15 percent, costs fell by 8 percent, and customer satisfaction reached an all-time high.', []],
        ],
        // Level 13: Full Sentences (4 exercises)
        [
            ['Mixed punctuation set A', 'sentences', 'She asked, "Did you finish the report?" He nodded, closed his laptop, and headed to the meeting. The package arrived on Tuesday; however, it was damaged, so we sent it back the very next day. Wait — before you go, did you check the schedule? The meeting was moved to three o\'clock today.', []],
            ['Mixed punctuation set B', 'sentences', 'She said, "I\'ll be there by noon," but she arrived at two — cold, apologetic, and slightly damp. The results were clear: group A improved by 12%, group B by 8%, and group C by only 3% overall. Why rush? The train does not leave until seven, and the station is only fifteen minutes away here.', []],
            ['Complex sentence structures A', 'sentences', 'The committee, which had been meeting weekly since January, finally reached a decision that satisfied both the budget constraints and the quality standards they had established at the outset of the project. Although the initial proposal was rejected by a margin of two votes, the revised version addressed every concern raised during the first review and received unanimous approval.', []],
            ['Complex sentence structures B', 'sentences', 'The startup, founded by two former classmates who had met during their undergraduate studies in computer science, secured a second round of funding that valued the company at approximately one hundred twenty million dollars, a figure that reflected both the strength of their intellectual property and the growing demand for their particular approach to real-time data processing.', []],
        ],
        // Level 14: Paragraphs (4 exercises)
        [
            ['Practice and learning paragraphs', 'paragraph', 'Practice improves when each session has a small, clear goal. Begin slowly, notice which keys require attention, and repeat the difficult movement with patience. Speed arrives after accuracy becomes dependable. End each session by noting one thing that felt easier than yesterday. Typing is a conversation between your eyes, hands, and attention. Read a few words ahead, keep your wrists neutral, and allow errors to teach you where your rhythm needs more care. Progress hides inside repetition, waiting to be noticed. Trust the process, and the numbers will follow.', []],
            ['Nature paragraphs', 'paragraph', 'Fog settled into the valley overnight and lingered until mid-morning. When it finally lifted, the hills appeared one ridge at a time, as if the landscape were being assembled from memory. Sheep surfaced first, then stone walls, then the thin road that climbed toward the pass. A single old fig tree anchors the courtyard of the abandoned farmhouse. Travelers who shelter beneath it carve initials into its bark, and the trunk has become a quiet archive of everyone who ever rested there.', []],
            ['Science paragraphs', 'paragraph', 'Calibration is the quiet work behind every trustworthy measurement. A sensor that drifts by two percent can invalidate months of data collection, so laboratories compare instruments against reference standards on fixed schedules. The discipline is unglamorous, but nearly every modern technology depends on it silently. Compilers translate human-readable instructions into machine operations through a series of passes, each simplifying the problem for the next. Optimization happens late in that pipeline, when the compiler understands both the intent of the code and the constraints of the target hardware.', []],
            ['Business paragraphs', 'paragraph', 'A useful meeting ends with decisions, owners, and dates. Without those three things, even an energetic discussion can fade into a list of unfinished ideas. Clear communication saves time and reduces confusion in every team. A well-written email is worth a dozen follow-up meetings. Always state the purpose in the first sentence so the reader knows exactly what is expected. Deadlines matter because they create structure and accountability. When everyone understands the timeline, projects move forward smoothly and without unnecessary delays.', []],
        ],
        // Level 15: Numbers & Symbols (5 exercises)
        [
            ['Numeric context passages', 'custom', 'Invoice #4821: 6 items at $14.50 each, plus 8% tax and a $2.00 handling fee — total due: $95.86. The temperature rose from 18°C at 7:00 AM to 31°C by 2:30 PM, a gain of 13 degrees in 7.5 hours. Q3 revenue reached $4.7M, up 22% from Q2\'s $3.85M and 41% above the $3.33M recorded in Q3 last year.', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '$', '%', '#']],
            ['Symbol-heavy professional text', 'custom', 'Send your request to support@example.com or call +1-800-555-0192 between 9:00 AM and 5:00 PM EST. Use the formula: profit = (revenue − costs) × (1 − tax_rate); ensure each variable is defined first. The API returns JSON: {"status": 200, "count": 47, "next": "/api/v2/items?page=2&limit=25"}.', ['@', '#', '$', '%', '&', '(', ')', '{', '}', '"']],
            ['Technical specifications', 'paragraph', 'The system architecture consists of three primary layers: a presentation layer built with React 18 and TypeScript, an API layer using Express.js with Zod schema validation, and a persistence layer backed by MongoDB 7.0 with Mongoose ODM. Communication between the API and presentation layers follows the OpenAPI 3.1 specification, with all endpoints documented and versioned under the /api/v2 namespace. Authentication uses JWT tokens with a 15-minute access window and 7-day refresh token rotation.', []],
            ['Scientific notation', 'paragraph', 'The experiment measured acceleration at 9.81 m/s² under standard gravity (g = 9.80665 m/s²). The object, with a mass of 2.45 kg, traveled 12.7 meters in 3.2 seconds, yielding an average velocity of 3.97 m/s. Kinetic energy was calculated as ½mv² = 0.5 × 2.45 × 3.97² = 19.3 J. The measurement uncertainty was ±0.03 m/s² for acceleration and ±0.1 meters for distance, resulting in a combined uncertainty of approximately 2.4% for the energy calculation.', []],
            ['Legal and financial text', 'paragraph', 'The agreement shall be governed by the laws of the State of Delaware, without regard to its conflict of laws provisions. Any dispute arising under or in connection with this Agreement shall first be submitted to mediation administered by the American Arbitration Association under its Commercial Mediation Procedures. If mediation is unsuccessful within 30 days, the dispute shall be resolved by binding arbitration in accordance with the AAA\'s Commercial Arbitration Rules, with the arbitration to be conducted in Wilmington, Delaware.', []],
        ],
        // Level 16: Advanced Typing (5 exercises)
        [
            ['Professional and editorial passages', 'paragraph', '"True mastery," the coach said firmly, "is consistency under pressure." She had typed 94 WPM for twenty straight minutes — every semicolon, dash, and quoted phrase landing exactly where it belonged. That is the standard: deliberate, economical, relentless. The memo read: "Effective immediately, all project leads must submit weekly status updates (Fridays, 4:00 PM) via the shared dashboard at https://projects.internal — no exceptions." Twelve managers nodded; two quietly opened their calendars. Precision typing is not about your fastest speed. It is about your slowest comfortable speed, because that is where your real ceiling lives.', []],
            ['Code-like and technical passages', 'custom', 'function debounce(fn: () => void, delay: number): () => void {\n  let timer: ReturnType<typeof setTimeout>;\n  return () => { clearTimeout(timer); timer = setTimeout(fn, delay); };\n}', []],
            ['Academic paper abstracts', 'paragraph', 'This study examines the relationship between organizational learning capacity and innovation performance in small and medium-sized enterprises (SMEs) across the European Union. Using a mixed-methods approach combining structural equation modeling (SEM) with semi-structured interviews conducted at 87 firms in 6 countries, we find that knowledge sharing practices, training investment, and managerial support for experimentation collectively explain 62% of the variance in patent output (R² = 0.62, F(3, 83) = 45.2, p < 0.001).', []],
            ['Technical documentation', 'paragraph', 'The Authentication Service implements OAuth 2.0 with PKCE (Proof Key for Code Exchange) to secure authorization flows for both web and mobile clients. The flow begins when the client generates a code_verifier (a cryptographically random string of 43–128 characters) and computes its SHA-256 hash (code_challenge). The authorization request includes the code_challenge and code_challenge_method parameters. After the user authenticates, the authorization server issues an authorization_code valid for 10 minutes.', []],
            ['Legal and complex financial', 'paragraph', 'WHEREAS, the Parties desire to enter into this Agreement to set forth the terms and conditions under which the Service Provider will deliver the Services to the Client; and WHEREAS, the Client wishes to engage the Service Provider to provide certain technology consulting services as more fully described in Exhibit A (the "Statement of Work"); NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows.', []],
        ],
    ];
    await Exercise_1.default.insertMany(exerciseSets.flatMap((set, lessonIndex) => set.map(([title, type, fallbackContent, targetKeys], exerciseIndex) => {
        const lessonNum = lessonIndex + 1;
        const exNum = exerciseIndex + 1;
        const content = lessonContent_service_1.VARIANTS[lessonNum]?.[exNum]?.[0] || fallbackContent;
        return {
            lessonId: learnLessons[lessonIndex]._id,
            title,
            type,
            content,
            targetKeys,
            language: 'en',
            level: Math.min(lessonIndex + 1, 9),
            difficulty: Math.min(lessonIndex + 1, 9),
            order: exerciseIndex + 1,
            isActive: true,
        };
    })));
    const totalExercises = exerciseSets.reduce((sum, set) => sum + set.length, 0);
    console.log(`✅ Seeded ${learnLessons.length} ordered Learn levels with ${totalExercises} exercises`);
    console.log('🎉 Seed complete!');
    await mongoose_1.default.disconnect();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map