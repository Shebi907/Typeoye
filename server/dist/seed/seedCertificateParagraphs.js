"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
/**
 * Seed the Certificate Typing Test paragraph library.
 *
 *   npm run seed:certificate
 *
 * Idempotent: upserts each paragraph only when the exact content is missing,
 * and never deletes anything (admin-created paragraphs are preserved).
 *
 * 117 built-in paragraphs: 39 easy / 39 medium / 39 hard.
 */
const mongoose_1 = __importDefault(require("mongoose"));
const CertificateParagraph_1 = __importDefault(require("../models/CertificateParagraph"));
const env_1 = require("../config/env");
const paragraphs = [
    // ── Easy (39) ─────────────────────────────────────────────────────────────
    ['easy', 'Learning to type efficiently can save time and make everyday computer tasks much easier. With regular practice, users can improve both their speed and accuracy while developing better keyboard habits.'],
    ['easy', 'The morning sun rises over the quiet town and fills the streets with warm light. Birds begin to sing, and the smell of fresh bread drifts from the bakery across the road.'],
    ['easy', 'A good breakfast gives you energy for the whole day. Eggs, toast, and fruit are simple choices that taste great and keep you going until lunchtime.'],
    ['easy', 'My school sits beside a large green field where students play during breaks. We like to run races, kick a ball, or just sit and talk with friends in the shade.'],
    ['easy', 'Cats are quiet pets that like to sleep in sunny spots. They clean themselves often and only make noise when they want food or attention.'],
    ['easy', 'In winter the streets turn white and the air grows cold. Children put on thick coats, gloves, and hats before they go outside to play in the snow.'],
    ['easy', 'Dad cooks rice and chicken for dinner on weekends. He adds carrots, peas, and a little salt, and the whole house begins to smell wonderful.'],
    ['easy', 'Books take readers to new places without leaving the house. A simple story about a boy and his dog can make you laugh, think, and feel brave.'],
    ['easy', 'The weather report says it will rain all afternoon. I will take my umbrella and a jacket when I walk to the shop to buy milk and bread.'],
    ['easy', 'Our family visits the park every Saturday. We bring a blanket, a ball, and plenty of water, then stay until the evening bell rings.'],
    ['easy', 'Trains are a fast way to move between cities. The seats are comfortable, the windows are wide, and the trip gives you time to read or rest.'],
    ['easy', 'Some games need two players and others need a whole team. Playing games teaches patience, fairness, and how to work with other people.'],
    ['easy', 'Music can change how you feel in seconds. A happy song lifts your mood, and a quiet tune helps you focus while you study or work.'],
    ['easy', 'Fresh fruit is a smart snack between meals. Apples, bananas, and oranges are easy to carry, need no cooking, and taste sweet on their own.'],
    ['easy', 'The corner shop sells milk, rice, soap, and paper. It is small, but most people in the neighborhood find what they need within a minute.'],
    ['easy', 'Farmers wake up before the sun to care for their crops. They check the soil, water the plants, and hope for good weather all season long.'],
    ['easy', 'At night the sky fills with tiny lights. Some people point to the moon and count the stars, while others look for shapes hidden among them.'],
    ['easy', 'Autumn leaves turn red and gold before they fall to the ground. Raking them into piles is a fun job when you splash through them afterward.'],
    ['easy', 'Painting is a hobby that needs only paper and colors. You can draw a house, a tree, a river, or anything that comes to mind.'],
    ['easy', 'Dinner at our table is a quiet time for the family. Everyone shares one thing about their day before the plates are cleared away.'],
    ['easy', 'Mail arrives at noon and brings letters, bills, and sometimes surprises. A postcard from a faraway friend is the best kind of mail.'],
    ['easy', 'Clocks help us keep track of the day. A loud bell marks the hour, and small hands tell us when it is time for lunch or school.'],
    ['easy', 'Plants need light, water, and care to grow well. A small pot on the window sill can turn a plain room into a green and lively space.'],
    ['easy', 'My desk is tidy and full of things I use every day. A lamp, a few pens, and my notebook stay near the keyboard at all times.'],
    ['easy', 'Our home is small but bright, with big windows in every room. Evening sun pours in through the kitchen, and the walls glow a soft orange.'],
    ['easy', 'When it rains hard, the streets fill with small pools of water. Umbrellas pop open in every color, and shoes get wet no matter how fast you run.'],
    ['easy', 'Friends make every day better. They listen when you talk, help when you fall, and laugh with you over the silliest little things.'],
    ['easy', 'Simple toys are often the best toys. A ball, some blocks, and a rope can keep a child busy for hours without any lights or sounds.'],
    ['easy', 'The beach is lovely in the early morning. The water is calm, the sand is cool, and the only noise is the soft sound of the waves.'],
    ['easy', 'Buses follow the same route every day and stop at the same corners. Riding one is easy when you know the number and the direction.'],
    ['easy', 'Gardens need patient hands and steady care. Pull a weed, water the rows, and soon tiny green shoots become strong leafy plants.'],
    ['easy', 'Birthdays come once a year and feel extra special. Cakes, candles, and a few close friends are all you really need to celebrate.'],
    ['easy', 'A good night of sleep makes the next day much easier. Early to bed, a dark room, and a quiet house help your body rest well.'],
    ['easy', 'Short walks after lunch keep your body active and your mind clear. Even ten minutes outside can make the afternoon feel lighter.'],
    ['easy', 'Rice grows in flooded fields that are full of water during part of the year. Farmers plant it by hand and harvest it when the grains turn golden.'],
    ['easy', 'Shoes protect your feet and come in many shapes. Strong boots suit hiking, light sandals suit summer, and soft slippers suit home.'],
    ['easy', 'Wide windows let fresh air move through the house. Opening them for a few minutes clears the room and brings the smell of the garden inside.'],
    ['easy', 'Bikes are quick, quiet, and good for the planet. A short ride to school or the market is faster than walking and keeps you fit.'],
    ['easy', 'Swimming in the pool on a hot day is a real treat. The cool water takes the heat away, and floating on your back feels perfectly calm.'],
    // ── Medium (39) ───────────────────────────────────────────────────────────
    ['medium', 'Remote work has changed how many people plan their days. Without a long commute, employees can use the extra time for chores, exercise, or simply a slower start, which usually improves their focus during working hours.'],
    ['medium', 'Strong communication depends on listening as much as speaking. When people pay attention to tone and body language, misunderstandings become rare, and teams move forward with much less friction.'],
    ['medium', 'Learning a second language opens doors that stay closed otherwise. It improves memory, makes travel smoother, and offers a fresh way to see everyday situations, even if progress comes in small daily steps.'],
    ['medium', 'Photography trains your eye to notice light, shape, and timing. A good photo is rarely an accident; it comes from waiting for the right moment and framing the subject with care.'],
    ['medium', 'Recycling programs work best when people understand what each bin accepts. Clean plastic, dry paper, and empty glass are easy to sort, while food residue in a container can ruin an entire batch.'],
    ['medium', 'Old cities carry their history in every street corner. A single neighborhood may hide a medieval gate, a modern market hall, and a park built over a river, all within a fifteen minute walk.'],
    ['medium', 'Regular exercise does more than build muscle. It steadies your mood, sharpens your attention, and helps you sleep through the night, which is why doctors describe it as close to a natural medicine.'],
    ['medium', 'Budgets are simple on paper but hard in practice. The trick is not restricting everything; it is choosing a few clear priorities and letting small, flexible spending happen within sensible limits.'],
    ['medium', 'Public speaking feels frightening to most people at first. Preparation changes everything because a speaker who knows the material well can look at the audience, slow down, and trust the structure.'],
    ['medium', 'Digital skills are no longer optional in many careers. Even trades that rely on physical work now use tablets, scheduling software, and social media to find clients and track their projects.'],
    ['medium', 'Volunteering offers benefits that go both ways. Communities gain helping hands, while volunteers meet new people and build confidence, often learning that the smallest tasks bring the deepest satisfaction.'],
    ['medium', 'Markets are liveliest early in the morning when the produce is fresh. Vendors arrange their stalls, bargain cheerfully, and swap news, making the whole square feel like a daily village meeting.'],
    ['medium', 'Museums preserve objects that would otherwise vanish with time. A ceramic bowl, a handwritten letter, or a faded photograph can still teach visitors about the lives of people who lived centuries ago.'],
    ['medium', 'Weather affects more than weekend plans. Farmers watch the forecast before planting, airlines adjust their routes, and cities prepare drains and shelters long before the first heavy storm arrives.'],
    ['medium', 'Music genres borrow from each other constantly. Jazz influenced rock, electronic producers sample classical strings, and a catchy melody can travel across countries before most people notice.'],
    ['medium', 'Social media rewards consistency over brilliance. Accounts that post regularly with clear images and honest captions tend to grow steadily, while perfect posts that appear once a month often stay invisible.'],
    ['medium', 'Writing clearly takes more effort than writing cleverly. Simple sentences, concrete examples, and short paragraphs make ideas easy to follow, and readers rarely complain that a text was too clear.'],
    ['medium', 'Design is about solving problems, not decorating surfaces. Good design guides the eye, reduces confusion, and disappears into the background so the user can focus on the task at hand.'],
    ['medium', 'Sleep researchers now treat sleep as an active process rather than a passive pause. During deep rest the brain sorts memories, repairs tissue, and clears waste, which explains why a short night affects everything from mood to judgement.'],
    ['medium', 'Holding a daily planning session keeps scattered tasks under control. Listing three priorities each morning and reviewing them each evening prevents small errands from crowding out the work that truly matters.'],
    ['medium', 'Cooking techniques travel well across cultures. Steaming, fermenting, and slow simmering appear in kitchens everywhere, which is why a traveler can recognize familiar methods even in unfamiliar dishes.'],
    ['medium', 'Teams succeed when trust replaces supervision. People who know their colleagues will cover for them bring problems forward early instead of hiding them, and honest talk usually leads to faster fixes.'],
    ['medium', 'Learning from failure is a skill of its own. A project that goes wrong reveals weak assumptions, and teams that write down what they learned tend to avoid repeating the same costly mistakes.'],
    ['medium', 'Electric vehicles are getting cheaper, but their real cost depends on how they are charged. Home overnight charging remains the cheapest option, while public fast chargers suit occasional long trips best.'],
    ['medium', 'Reading habits shape thinking more than most people admit. Frequent readers absorb patterns of argument and vocabulary almost without noticing, which later shows up in their own writing and speech.'],
    ['medium', 'Small towns often have a stronger sense of community than large cities. Neighbors know each other by name, shops close for holidays, and local events draw nearly the whole population to one square.'],
    ['medium', 'Sunlight regulates the body clock through the eyes. Morning light moves the rhythm earlier, while bright screens at night push it later, which explains why bedroom lighting can change whole sleeping patterns.'],
    ['medium', 'Newsrooms weigh speed against accuracy every single day. An early report earns attention, but a corrected story damages trust, so careful outlets prefer to confirm facts before publishing anything dramatic.'],
    ['medium', 'Financial planning works best when targets are realistic. A modest monthly saving goal, reviewed once a quarter, beats an ambitious annual plan that nobody checks until December surprises.'],
    ['medium', 'Gardening teaches patience that technology rarely rewards. Seeds follow their own schedule, respond to the season, and refuse to be hurried, so success depends on steady attention rather than effort.'],
    ['medium', 'Books about habits agree on one principle: small changes compound. Reading ten pages each day, walking one extra stop, or writing two sentences builds momentum beyond what any single dramatic effort achieves.'],
    ['medium', 'The internet makes information cheap, which makes judgement valuable. Knowing where to look matters less now than knowing which source to trust, and healthy skepticism has become a practical daily skill.'],
    ['medium', 'Great coffee starts with good beans but depends on careful roasting. Temperature, time, and rest after roasting all shape flavor, and a skilled roaster can turn the same batch into very different cups.'],
    ['medium', 'Cities are experimenting with streets that serve people before cars. Wider sidewalks, protected bike lanes, and shaded benches reduce noise and make shopping districts lively places to spend an afternoon.'],
    ['medium', 'Memories are built as much by emotion as by detail. A trip fades into a blur of dates, but the exact smell of rain at a market stays for years, which is why experiences often outrank photos when we recall a journey.'],
    ['medium', 'Freelancers trade stable paychecks for flexible schedules. That trade only works with firm discipline: clear project scopes, honest deadlines, and a separate space for work keep the arrangement healthy.'],
    ['medium', 'Coffee shops serve as informal offices for many people. They offer power outlets, steady tables, and background noise that some find easier to concentrate in than the silence of a home desk.'],
    ['medium', 'Plastic recycling labels confuse almost everyone. The chasing-arrows symbol says nothing about whether a local plant will accept the item, so checking the city guidelines often matters more than reading the cup.'],
    ['medium', 'Curiosity drives learning better than obligation. A student who asks why something works will happily spend an hour on a topic, while the same student resists even ten minutes of forced drilling on facts.'],
    // ── Hard (39) ─────────────────────────────────────────────────────────────
    ['hard', 'Sustainable transport requires more than cleaner engines; it demands that whole neighborhoods be designed around walking, cycling, and frequent transit so that daily errands no longer depend on a private car.'],
    ['hard', 'Economic incentives ripple through behavior in subtle ways. When parking is free, everyone drives; when it is priced, commuters suddenly rediscover trains, buses, and the simple appeal of a ten-minute walk.'],
    ['hard', 'The scientific method advances by disproving comfortable explanations. A hypothesis survives only while experiments fail to refute it, which is why confident claims without testable predictions deserve immediate skepticism.'],
    ['hard', 'Understanding context is the difference between information and meaning. A single statistic can mislead, but the same number placed beside its method, timeframe, and limitations begins to tell a useful story.'],
    ['hard', 'Ocean currents regulate the planet by moving heat from the tropics toward the poles. Their pace is slow, yet even small shifts in temperature or salinity can rearrange weather patterns across both hemispheres within decades.'],
    ['hard', 'Architecture shapes daily behavior more than most residents notice. Generous staircases invite movement, narrow corridors discourage lingering, and the position of a window decides whether a room feels cramped or calm.'],
    ['hard', 'Journalism faces tension between engagement and accuracy in an environment where outrage travels faster than nuance. Headlines compete for attention while the article underneath must still carry the qualifications that truth requires.'],
    ['hard', 'Logical fallacies survive because they feel persuasive. Appeal to authority, slippery slopes, and false dilemmas all shortcut careful reasoning, and recognizing them in conversation is a skill as practical as any spreadsheet formula.'],
    ['hard', 'The value of biodiversity extends beyond beauty into stability. Diverse ecosystems buffer against disease, drought, and pests, whereas simplified landscapes tend to collapse suddenly when any single factor changes dramatically.'],
    ['hard', 'Historical records are never complete, and historians read their gaps as carefully as their contents. A missing census, a silent diary, or an unsigned letter can reveal more about power and exclusion than hundreds of preserved documents.'],
    ['hard', 'Artificial intelligence excels at pattern recognition, yet it remains confined by the data it receives. Bias embedded in historical records therefore reappears in algorithmic decisions, which makes careful dataset auditing an ethical necessity.'],
    ['hard', 'Urban farms occupy stubbornly small spaces, but their productivity defies their size. Intensive techniques, vertical structures, and precise watering let a rooftop grow more vegetables per square meter than a conventional countryside field.'],
    ['hard', 'Negotiation succeeds less through pressure than through preparation. Knowing your own limits, mapping the other side\u2019s constraints, and separating emotions from positions usually produces durable agreements that hostile tactics undermine.'],
    ['hard', 'Sleep deprivation impairs judgement in ways that drowsy drivers rarely perceive. Reaction times lengthen, attention narrows, and confidence in one\u2019s own alertness paradoxically increases, making fatigue a quietly dangerous condition.'],
    ['hard', 'Language shapes thought at the margins, not the core. Speakers of different tongues all solve similar problems, but the categories their grammar provides influence which details they notice, remember, and treat as obvious.'],
    ['hard', 'The economics of energy storage explain much of the renewable transition. Since the sun and wind do not follow demand, cheap batteries that shift a few hours of supply libraries into a stable grid have become as important as the generators themselves.'],
    ['hard', 'Ant colonies function without a central planner. Simple rules followed by thousands of individuals produce bridges, air conditioning, and food storage so reliable that engineers study them for inspiration in distributed system design.'],
    ['hard', 'Documentaries select, compress, and frame reality even when they never invent a fact. Every edit is an argument, which means viewers should judge a film by the evidence it omits as carefully as by what it shows.'],
    ['hard', 'Medieval trade routes carried more than silks and spices. Techniques, religious ideas, legal codes, and disease all traveled with the merchants, reshaping societies far beyond the ports where their ships anchored.'],
    ['hard', 'Plate tectonics explains phenomena that once demanded separate theories. Earthquakes, volcanic arcs, mountain chains, and the fossil harmony across continents all follow logically from a handful of moving plates interacting along their margins.'],
    ['hard', 'Procrastination is rarely laziness; it is usually discomfort avoidance. Tasks that trigger anxiety, ambiguity, or boredom get postponed indefinitely, which is why breaking work into concrete, low-stakes steps disarms the urge to delay.'],
    ['hard', 'Water scarcity is a distribution problem as much as a supply problem. The planet holds plenty of fresh water, yet it falls unevenly across seasons and regions, so storage, pricing, and allocation often decide who goes thirsty.'],
    ['hard', 'An aquifer is a slow bank, not a fast faucet. Groundwater that took centuries to accumulate can be drained in one generation, and once overdrawn, the sinking land and salty intrusion can make recovery effectively impossible.'],
    ['hard', 'Folklore preserves values that written law rarely captures. A cautionary tale about greed, a proverb about patience, or a festival built around harvest teaches each generation how a community expects its members to behave.'],
    ['hard', 'Quantum computing replaces classical bits with qubits, which can represent combinations of zero and one simultaneously. This superposition allows certain problems, such as breaking encryption or simulating molecules, to be attacked with startling efficiency.'],
    ['hard', 'Cities concentrate opportunity precisely because they concentrate people. Dense networks of specialists trade knowledge informally, and that spillover of ideas, rather than any single institution, accounts for much of a region\u2019s innovation.'],
    ['hard', 'The personal essay succeeds when honesty outweighs polish. Readers forgive awkward structure and wandering narrative if the writer seems genuinely candid, while a flawless piece that feels guarded rarely leaves a lasting impression.'],
    ['hard', 'Seasonal migration in birds follows cues astronomers would recognize. Magnetic fields, star patterns, and polarized light all contribute to navigation, and experiments that disrupt any single cue reveal how redundant the system truly is.'],
    ['hard', 'Economic inequality concentrates attention, not just income. The wealthy shape media, politics, and taste, which means measures of inequality describe not only purchasing power but also whose problems receive public priority.'],
    ['hard', 'Restoration ecology differs from conservation because it actively rebuilds. Where preservation freezes a landscape, restoration reintroduces species, reshapes hydrology, and then steps back, accepting that the final form may surprise its designers.'],
    ['hard', 'Cryptography protects privacy through mathematics alone, without trust in any single party. A message locked with a public key reads as noise to everyone except the holder of the matching private key, a principle that now guards most of the internet.'],
    ['hard', 'Legal systems change through precedent as much as through legislation. Judges who apply past rulings reveal an influential and gradual path of reform, one where language chosen decades ago quietly shapes rights granted today.'],
    ['hard', 'Attention is the scarcest resource in the digital economy. Every application competes for it, and the platforms that succeed are those that best convert human time into predictable, measured engagement rather than genuine value.'],
    ['hard', 'Extreme weather is not evidence and absence is not proof; climate change appears as a shift in odds. Single storms prove little, but the long drift of temperatures, sea levels, and storm frequency forms a pattern that physics predicted decades in advance.'],
    ['hard', 'Agile methodologies borrowed their manifesto from software, yet their lessons generalize. Short feedback loops, frequent delivery, and candid retrospectives improve teams across many fields by keeping assumptions visible while they are still cheap to change.'],
    ['hard', 'Reducing food waste begins with understanding why it happens. Perfect looks, oversized portions, and unclear storage labels all contribute, and simple changes such as smaller plates and clearer date tags routinely cut waste by a third.'],
    ['hard', 'Currencies have always relied on belief as much as metal or paper. A note is only as valuable as the confidence people place in the institution that issues it, a fact that digital currencies have inherited in an entirely new form.'],
    ['hard', 'Conservation of energy governs machines whose complexity obscures the principle. Every motor, furnace, and circuit obeys the same account books, which is why efficiency gains always require a precise look at where energy actually flows.'],
    ['hard', 'Culture changes fastest at its boundaries. The most inventive food, music, and language tend to appear where communities meet and trade, while isolated traditions preserve old forms precisely because they lack the exposure that would transform them.'],
];
/** Fold whitespace so comparisons are stable regardless of line breaks. */
function normalize(value) {
    return value.replace(/\s+/g, ' ').trim();
}
async function connectWithRetry(attempts = 8) {
    for (let i = 1; i <= attempts; i++) {
        try {
            await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 25000,
                socketTimeoutMS: 120000,
                connectTimeoutMS: 25000,
            });
            console.log(`MongoDB connected: ${env_1.env.MONGODB_URI.replace(/\/\/[^@]+@/, '//***@')}`);
            return;
        }
        catch (err) {
            console.warn(`db connect attempt ${i}/${attempts} failed, retrying...`);
            await new Promise((r) => setTimeout(r, 3000 * i));
        }
    }
    throw new Error('Could not connect to MongoDB');
}
async function run() {
    await connectWithRetry();
    const seen = new Map();
    let upserted = 0;
    for (const [difficulty, rawContent] of paragraphs) {
        const content = normalize(rawContent);
        const key = content.toLowerCase();
        if (seen.has(key)) {
            console.warn(`SKIP duplicate in seed source: "${content.slice(0, 50)}..."`);
            continue;
        }
        seen.set(key, difficulty);
        for (let attempt = 1; attempt <= 8; attempt++) {
            try {
                const result = await CertificateParagraph_1.default.updateOne({ content }, { $setOnInsert: { content, difficulty, isActive: true } }, { upsert: true });
                if (result.upsertedCount > 0)
                    upserted += 1;
                break;
            }
            catch (err) {
                console.warn(`upsert attempt ${attempt}/8 failed for "${content.slice(0, 40)}..."`);
                await new Promise((r) => setTimeout(r, 2000 * attempt));
                if (!mongoose_1.default.connection.readyState)
                    await connectWithRetry();
            }
        }
    }
    const total = await CertificateParagraph_1.default.countDocuments();
    console.log(`Seeded ${upserted} certificate paragraphs (${upserted} new, ${total} total in library).`);
    await mongoose_1.default.disconnect();
}
run().catch((error) => {
    console.error('Seed failed:', error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
});
//# sourceMappingURL=seedCertificateParagraphs.js.map