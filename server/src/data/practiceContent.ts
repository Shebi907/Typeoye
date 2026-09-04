export type PracticeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export const WORD_BANKS: Record<PracticeDifficulty, string[]> = {
  beginner: [
    'the', 'and', 'for', 'you', 'are', 'that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'want', 'been', 'good', 'much', 'some', 'time', 'more',
    'only', 'over', 'new', 'work', 'back', 'most', 'just', 'then', 'them', 'take', 'come', 'make', 'look', 'give', 'find', 'like', 'made', 'word', 'were', 'said',
    'each', 'many', 'also', 'into', 'her', 'him', 'his', 'she', 'our', 'day', 'way', 'may', 'say', 'get', 'got', 'run', 'cut', 'sit', 'see', 'two',
    'use', 'put', 'old', 'big', 'far', 'few', 'yes', 'red', 'sun', 'sky', 'boy', 'girl', 'tree', 'fish', 'bird', 'book', 'door', 'hand', 'head', 'home',
    'house', 'kind', 'land', 'life', 'line', 'name', 'next', 'night', 'open', 'play', 'read', 'room', 'school', 'sound', 'space', 'star', 'stay', 'story', 'town', 'walk',
    'water', 'white', 'whole', 'world', 'year', 'young', 'after', 'again', 'begin', 'bring', 'clean', 'close', 'drive', 'early', 'every', 'field', 'front', 'green', 'ground', 'light',
    'might', 'never', 'often', 'paper', 'piece', 'place', 'plant', 'point', 'river', 'round', 'small', 'start', 'still', 'stone', 'sweet', 'think', 'thank', 'under', 'until', 'voice',
    'write', 'apple', 'bread', 'cloud', 'mouse', 'sleep', 'happy', 'jump', 'laugh', 'smile', 'puppy', 'flower', 'safe', 'soft', 'warm', 'cold', 'hot', 'bright', 'dark', 'quiet',
    'near', 'hard', 'easy', 'path', 'hill', 'lake', 'park', 'shop', 'boat', 'egg', 'pie', 'dog', 'cat', 'cow', 'hen', 'pen', 'moon', 'sand', 'rain', 'snow',
    'wind', 'fire', 'food', 'milk', 'salt', 'soup', 'tea', 'corn', 'bean', 'rice', 'wood', 'glass', 'sour', 'tall', 'thick', 'heavy', 'kite', 'toy', 'game', 'bell',
  ],
  intermediate: [
    'agree', 'allow', 'always', 'amount', 'answer', 'appear', 'around', 'arrive', 'asleep', 'attack', 'attend', 'autumn', 'aware', 'awkward', 'balance', 'barely', 'basket', 'battle', 'become', 'behind',
    'belong', 'beyond', 'border', 'borrow', 'bottle', 'bottom', 'branch', 'brave', 'breath', 'bridge', 'bubble', 'budget', 'bundle', 'burden', 'camera', 'candle', 'career', 'careful', 'castle', 'cement',
    'chance', 'change', 'charge', 'chase', 'check', 'cherry', 'choice', 'choose', 'circle', 'climb', 'clock', 'coast', 'coffee', 'collect', 'college', 'colour', 'combine', 'comfort', 'common', 'compare',
    'complete', 'condition', 'connect', 'consider', 'content', 'corner', 'correct', 'cottage', 'courage', 'course', 'court', 'create', 'credit', 'cross', 'culture', 'current', 'custom', 'damage', 'danger', 'decide',
    'defeat', 'defend', 'degree', 'demand', 'depend', 'describe', 'desert', 'design', 'detail', 'develop', 'digital', 'direct', 'discuss', 'distance', 'district', 'double', 'doubt', 'dragon', 'dream', 'during',
    'eager', 'earth', 'easily', 'echo', 'edge', 'effort', 'either', 'elbow', 'energy', 'engine', 'enjoy', 'enough', 'enter', 'entire', 'escape', 'exact', 'examine', 'example', 'excite', 'excuse',
    'expect', 'expense', 'explain', 'explore', 'extra', 'factor', 'fairly', 'family', 'famous', 'fancy', 'fashion', 'favorite', 'feather', 'feature', 'fellow', 'festival', 'fiber', 'figure', 'finish', 'flame',
    'flavor', 'flight', 'flood', 'flower', 'focus', 'follow', 'forest', 'forward', 'frame', 'freedom', 'freeze', 'fresh', 'friendly', 'garden', 'gather', 'gentle', 'glance', 'golden', 'graduate', 'grateful',
    'ground', 'growth', 'handle', 'happen', 'healthy', 'height', 'helpful', 'history', 'holiday', 'honest', 'huge', 'humble', 'hungry', 'imagine', 'improve', 'include', 'income', 'inform', 'inside', 'invent',
    'journey', 'judge', 'junior', 'keeper', 'kernel', 'kitchen', 'ladder', 'laptop', 'launch', 'lawyer', 'leader', 'lesson', 'letter', 'library', 'likely', 'liquid', 'listen', 'little', 'living', 'locate',
    'lonely', 'manner', 'market', 'master', 'matter', 'measure', 'member', 'memory', 'method', 'middle', 'mighty', 'mirror', 'moment', 'monitor', 'mother', 'motion', 'mountain', 'muscle', 'museum', 'native',
  ],
  advanced: [
    'abandon', 'ability', 'absence', 'abstract', 'academic', 'access', 'accompany', 'accurate', 'achieve', 'acknowledge', 'acquire', 'adequate', 'adjust', 'admir', 'advance', 'advantage', 'advocate', 'aesthetic', 'agency', 'agenda',
    'aggressive', 'allocate', 'alternative', 'ambiguous', 'analyze', 'anticipate', 'apparent', 'appreciate', 'appropriate', 'approval', 'arbitrary', 'architecture', 'artificial', 'assess', 'assignment', 'assistance', 'assumption', 'authority', 'automatic', 'available',
    'behavior', 'benefit', 'capable', 'capacity', 'category', 'caution', 'challenge', 'chamber', 'chaos', 'characteristic', 'chronic', 'circumstance', 'clarify', 'coincide', 'colleague', 'commentary', 'commercial', 'commission', 'commitment', 'commodity',
    'communicate', 'community', 'compatible', 'compensate', 'competent', 'compile', 'complex', 'comply', 'compose', 'compound', 'comprehensive', 'conceal', 'concede', 'concentrate', 'concept', 'conclude', 'concrete', 'conduct', 'confident', 'confine',
    'confirm', 'conflict', 'conform', 'confront', 'conscious', 'consequence', 'considerable', 'consistency', 'constant', 'constitute', 'constraint', 'construct', 'consult', 'consume', 'contemporary', 'context', 'controversial', 'convert', 'convey', 'convince',
    'coordinate', 'correspond', 'credible', 'criterion', 'crucial', 'cultivate', 'curriculum', 'deficiency', 'deliberate', 'demonstrate', 'depreciation', 'determination', 'dimension', 'discrepancy', 'discrimination', 'distribution', 'diverse', 'dynamics', 'elaborate', 'elevation',
    'eliminate', 'encapsulate', 'encompass', 'enthusiasm', 'equivalent', 'essential', 'evaluation', 'evolutionary', 'exaggeration', 'exclusively', 'expenditure', 'experimental', 'expertise', 'exploitation', 'extraordinary', 'facilitate', 'framework', 'fundamental', 'hypothesis', 'implement',
    'implication', 'incentive', 'independent', 'indicator', 'inevitable', 'influence', 'innovation', 'institution', 'integrity', 'intensity', 'interaction', 'interpret', 'intervention', 'intrinsic', 'investigate', 'justification', 'legislation', 'legitimate', 'magnitude', 'manipulation',
    'methodology', 'minimum', 'motivation', 'negotiate', 'nevertheless', 'objective', 'obligation', 'observation', 'occupy', 'opponent', 'orientation', 'overall', 'paradigm', 'participate', 'perceive', 'performance', 'perspective', 'phenomenon', 'philosophical', 'practical',
    'precise', 'proficiency', 'profound', 'qualitative', 'quantitative', 'recession', 'redundancy', 'reflection', 'regardless', 'reinforcement', 'relativity', 'relevant', 'reliable', 'resilience', 'resource', 'restoration', 'revolutionary', 'rhetorical', 'scenario', 'scholarship',
    'sensitivity', 'sequential', 'significant', 'sophisticated', 'stability', 'statistical', 'strategic', 'subsequent', 'substitute', 'substantial', 'sufficient', 'synthesis', 'systematic', 'tangible', 'theoretical', 'transformation', 'translation', 'ultimate', 'underlying', 'unprecedented',
    'utilization', 'validation', 'variability', 'versatility', 'viability', 'vigorous', 'vocabulary', 'vulnerability',
  ],
};

export const SENTENCE_BANKS: Record<PracticeDifficulty, string[]> = {
  beginner: [
    "The cat slept on a soft mat.",
    "We walk to school in the morning.",
    "She put the book on the table.",
    "It is a warm and sunny day.",
    "He likes to read before bed.",
    "The dog ran across the yard.",
    "I can sing a happy song.",
    "They play games after lunch.",
    "My mom made a big cake.",
    "The bird sits in the tree.",
    "We saw a red car today.",
    "The sun sets in the west.",
    "A small fish swam in the pond.",
    "Please close the door quietly.",
    "The cup is full of milk.",
    "Tom and Ann play with a ball.",
    "The train stops at the station.",
    "I like fresh bread with jam.",
    "The moon is bright tonight.",
    "She drew a picture of a house.",
    "We go to the park on Friday.",
    "The wind blows the leaves away.",
    "He opened the window wide.",
    "A bee landed on the red flower.",
  ],
  intermediate: [
    "The old bridge crosses the river near the center of town.",
    "She studied for the exam, then took a long walk to relax.",
    "The meeting began on time, and everyone brought a printed copy of the plan.",
    "Rain fell all morning, but the afternoon turned warm and clear.",
    "He saved a little money each week, so the repairs were easy to afford.",
    "The library stays open late on Thursdays for students who work evenings.",
    "Cooking at home costs less than eating out and is often much healthier.",
    "The train was delayed, yet most passengers arrived at the station early.",
    "Her camera captured the light over the lake as the clouds drifted past.",
    "We painted the fence in the garden, and the whole yard looked fresh again.",
    "The map showed the path through the forest, but the trail was hard to find.",
    "He answered every question carefully and then asked for more examples.",
    "The market opens at dawn, when the vegetables are still cool from the night.",
    "She folded the clean towels and placed them neatly in the tall closet.",
    "The concert started at eight, and the hall filled within minutes.",
    "Writing a clear email saves time because the reader understands at once.",
    "The parcel arrived late, so the gift was wrapped in a hurry.",
    "They collected the fallen apples and carried them home in a large basket.",
    "The coach explained the drill twice, then let the team practice it.",
    "Morning fog covered the valley, but the hills above stayed clear.",
    "His notes were neat and brief, with names and dates beside every idea.",
    "The bus runs every twenty minutes, so waiting is rarely a problem.",
    "She watered the plants, checked the mail, and locked the back door.",
    "The new shop sells fresh bread, local cheese, and strong coffee.",
  ],
  advanced: [
    "The committee met twice that month; the first session, nearly two hours, settled the budget, while the second approved the revised schedule.",
    "She insisted that we measure twice and cut once, a habit that saved the project at least three costly mistakes by March.",
    "Although the proposal seemed straightforward, persistent delays, caused by paperwork and approval bottlenecks, pushed the deadline to the 14th.",
    "The survey covered 412 households across six districts; among its findings, 78 percent favored the change, though support varied sharply by age.",
    "What began as an experiment under a single department grew, within five years, into a policy affecting 23,000 employees and four union agreements.",
    "His argument was elegant in principle, but the evidence, collected over two years and 300 interviews, remained surprisingly thin.",
    "The engineers debated three solutions: rebuild the foundation, reinforce the existing frame, or replace the structure entirely by winter.",
    "A trade-off emerged between speed and accountability; the fastest pathway risked mistakes that the slower, documented route could usually avoid.",
    "He wrote in the margin that the results were provisional, noting that the sample had shrunk from 150 participants to just 92 by the final week.",
    "The contract, signed on December 3, stated that repairs must begin within 30 days; otherwise, penalties of $500 per week would apply.",
    "Consider the alternatives logically: reduce capacity now and save costs, or invest further and accept a slower return over the next decade.",
    "The report identified three factors, namely funding, staffing, and timing, as decisive, yet it devoted most of its length to the first two.",
    "Despite its modest size, barely forty pages, the guideline reshaped practice in hospitals across the region within eighteen months.",
    "When the factory closed, 214 workers lost their positions; retraining programs offered new skills, but the transition took nearly a year.",
    "The author, whose earlier work had sold modestly, saw this volume reach 60,000 copies in its first quarter, a remarkable outcome.",
    "Critics agreed on the value of the research; however, they questioned whether its conclusions, drawn from a single season, could be generalized.",
    "Between 2001 and 2009, the city added 14 parks and 38 kilometers of cycling lanes, transforming its downtown into a livelier district.",
    "The phrase best available evidence appears throughout the policy, yet the document never defines precisely what qualifies as evidence.",
    "One exception clouded the otherwise promising results: the error rate rose from 3.2 percent to 7.8 percent after the software update.",
    "Rather than simplifying the manual, the committee expanded it, adding indexes, footnotes, and three appendices totaling 190 pages.",
    "Investors weighed the risk carefully; optimism ran high at the launch, but quarterly losses for five straight quarters tempered expectations.",
    "The curator argued that the painting, dated approximately 1620, had been misattributed, a claim supported by pigment analysis and provenance records.",
    "Staffing was the core problem: clinics rarely had more than two nurses during peak hours, and the backlog reached 4,000 patients by October.",
    "Two principles guided the rewrite, namely clarity above completeness and brevity above ornament, though editors still trimmed another 40 pages.",
    "The proposal passed narrowly, 211 to 198, and its sponsors immediately began drafting the amended regulations promised to opponents.",
    "What mattered, she concluded, was not the initial design but the discipline of revision: each draft, each critique, each careful second look.",
  ],
};

export const PARAGRAPH_BANKS: Record<PracticeDifficulty, string[]> = {
  beginner: [
    "The morning sun rose over the small town. Birds sang in the trees, and a cool breeze moved the leaves. People opened their doors and started the day.",
    "Sam and his sister went to the park. They took a ball and a red kite. The wind was strong, so the kite flew high above the trees.",
    "Anna cleaned her room after school. She put the books on the shelf and the toys in a box. The room looked neat and ready for the weekend.",
    "The farmer fed the hens each morning. He gathered the eggs and placed them in a basket. Then he walked the short path to the market.",
    "It rained all afternoon, so we stayed inside. Mom read a story, and Dad made hot tea. The rain stopped before dinner, and the sky turned pink.",
    "Leo walked to the library with his friend. He picked a book about space and found a quiet chair. They read for an hour before walking home.",
    "The bus came at eight in the morning. Children lined up with their bags. The driver smiled and opened the door, and the bus moved down the street.",
    "We planted small flower seeds in the garden. Every day we gave them water. After two weeks, green leaves came up through the soft soil.",
    "Tom learned to ride a bike in the summer. He fell once, but he tried again. Soon he could ride around the whole block without help.",
    "The bakery on Main Street smells wonderful in the morning. Fresh bread comes out of the big oven at nine. People stop by on their way to work.",
    "Grandma made soup for dinner. She added carrots, beans, and warm spices. The whole house filled with a good smell, and everyone asked for more.",
    "The stars came out as the sky grew dark. We sat on the porch and watched them. A cool breeze kept us company, and the night felt calm.",
    "Mia painted a picture of a boat on the sea. She used blue, green, and white. Her teacher put the painting on the wall for everyone to see.",
    "The little train left the station at noon. It passed green fields and quiet farms. The passengers looked out the windows and waved at the hills.",
    "Dad fixed the old clock on the shelf. He opened the back and cleaned the small gears. Now the clock ticks again, right on time.",
    "The puppy barked at the mail carrier every day. One day he sat quietly and wagged his tail. The carrier smiled and gave him a pat.",
    "We built a fort with chairs and an old sheet. It covered the corner of the room. We read books inside until it was time for lunch.",
    "The pool opens at ten in the summer. The water is cool and clear. Kids splash in the shallow end while parents rest near the fence.",
    "Jess saved her coins in a small jar. She counted them each night. When the jar was full, she bought a set of colorful markers.",
    "The clock on the wall struck three. School was over for the day. We walked home together, talking about games and homework and the weekend.",
  ],
  intermediate: [
    "The garden needed steady care through the season. She watered the beds each morning, pulled the weeds on weekends, and stacked the compost near the fence, so the tomatoes grew tall and the peppers stayed firm.",
    "Public libraries have changed a great deal in recent years. Beyond lending books, they now offer quiet workrooms, free internet, and evening classes, which makes them essential meeting places in most small towns.",
    "Learning a new skill takes patience rather than talent alone. The first weeks feel slow, errors are common, and progress seems invisible, yet steady practice gradually turns clumsy attempts into confident, reliable actions.",
    "Traffic filled the main road by seven, so Maya took the side streets instead. The longer route passed the old market, her favorite bakery, and a row of quiet houses, and she reached work only ten minutes late.",
    "The committee reviewed the proposal carefully before voting. Members questioned the budget, compared the three options, and asked for a detailed timeline, and in the end they approved the plan with two small changes.",
    "Rain threatened the outdoor concert all afternoon. The crew covered the speakers, the band checked the cables twice, and the crowd brought umbrellas, yet the sky cleared just before the first song began.",
    "Starting a garden taught us more than we expected. We learned about soil, weather, and timing, and we discovered that a few patient hours of weeding each week produce better results than sudden bursts of effort.",
    "The old building was restored rather than replaced. Workers saved the wooden beams, repaired the tall windows, and added a modern heating system, so the structure kept its character while becoming warm and efficient.",
    "Her article described the market in vivid detail. She noted the smell of fresh bread, the colors of stacked fruit, and the shouting of vendors, and readers wrote in to say the street felt familiar even if they had never visited.",
    "The science fair drew a large crowd that evening. Students explained their projects, judges asked pointed questions, and parents wandered between the tables, while the smaller displays near the back received the most careful attention.",
    "A reliable schedule makes the week feel lighter. By planning meals, chores, and meetings in advance, you remove small decisions during the day, leaving more energy for the work that genuinely matters.",
    "The bookstore hosted a reading on Friday night. Local authors shared short passages, listeners asked thoughtful questions, and the owner served tea and cookies, turning a simple event into a warm community gathering.",
    "Packing for the trip reminded him of past journeys. He folded clothes, charged the camera, and checked the weather forecast, then revised the list twice because the mountains called for layers rather than heavy luggage.",
    "The court rejected the appeal on technical grounds. The ruling noted missing paperwork, unanswered questions, and a late filing, and it advised the petitioner to consult counsel before submitting anything further.",
    "Community gardens soften the concrete edges of a city. Neighbors plant vegetables, children water the beds, and retired gardeners share advice, while the empty lots transform into green, productive gathering spaces.",
    "The bakery grew from a single counter into a neighborhood favorite. Customers came for the bread, stayed for the coffee, and returned for the seasonal pastries, and word soon spread beyond the immediate streets.",
    "Her research notes were thorough and orderly. Each interview had a summary page, each topic a color-coded folder, and each source a clear date, so the final report came together with surprisingly little revision.",
    "The team debated the feature during the weekly meeting. Some favored speed, others preferred stability, and a few argued for both, until a compromise plan gained support and the group agreed to test it for two weeks.",
    "The morning train delayed the trip by an hour. Passengers checked messages, bought coffee, and phoned their offices, while the conductor announced updates every fifteen minutes until the line reopened.",
    "Fog settled over the valley before dawn. The lighthouse beam circled slowly, fishermen waited near the harbor, and the ferry sounded its horn twice, then the sun burned through the haze by mid-morning.",
  ],
  advanced: [
    "The report ran to 240 pages, yet its central argument was simple: the city's investment in transit returned one dollar and forty cents for every dollar spent, though critics disputed the accounting and demanded a third-party review before the second phase.",
    "Adopting the new framework required more than enthusiasm; it demanded training. Across 14 departments, 3,000 staff attended workshops, and 68 percent later reported the system improved their daily work, while managers admitted the transition, which took nearly a year, cost far more than the initial estimates suggested.",
    "The novel opens with a paradox: a hero who succeeds by refusing every opportunity offered to him. By page 40 the reader understands the gambit, but the narrator, mischievous as ever, keeps the rewards and punishments deliberately ambiguous.",
    "Negotiations resumed at dawn after a night that produced little agreement. Both sides conceded the obvious points quickly, namely dates, venues, and budget ranges, but the clauses governing liability and early termination remained contested.",
    "The study enrolled 512 participants and tracked them for 18 months; its headline finding, that evening exercise reduced resting heart rate by nine percent on average, appeared on page 1, yet the full dataset revealed a striking exception among shift workers.",
    "His defense rested on a single phrase in the contract, subject to availability, which the plaintiff's lawyers argued had been added without consent. The case turned less on the words than on the emails exchanged between the parties, and the judge's verdict cited eleven of them directly.",
    "Economists remain divided over the policy's effect. One school credits it with lowering unemployment to 4.1 percent; another attributes the improvement to broader cycles, higher exports, and an unusually mild winter, while nearly everyone agrees the data cannot settle the question.",
    "The curator's claim, that the portrait was painted in 1622 rather than 1619, rested on three clues: a watermark in the canvas, a pigment unavailable before 1621, and an entry in a merchant's ledger. The reassignment, when it came, changed the painting's estimated value by 2.3 million.",
    "We asked the operators to record every stoppage, and the logs exposed the problem: 61 percent of delays traced to a single conveyor, and half of those occurred between 2:00 and 4:00 a.m., during the shift when maintenance coverage was thin.",
    "The ordinance passed 14 to 3 after months of hearings. Supporters cited public safety; opponents warned of cost and inconvenience, while the mayor, who had campaigned on the issue, called the vote a step long overdue, though enforcement demanded another 12 hires.",
    "Its thesis is unfashionable but defensible: the constraint, not the tool, drives creativity. The author builds the argument through case studies spanning three studios, four decades, and twenty-one products, and concedes in the closing chapter that freedom ultimately matters more.",
    "Production halted briefly when the sensor array reported pressure four times above normal; engineers traced the fault to a blocked relief valve installed the previous week. The incident, resolved in 90 minutes and costing roughly 12,000, prompted an audit of all sixty valves.",
    "The trial's outcome hinged on the timeline. The witness placed the meeting on June 3; the invoice, however, was dated the 9th, and the email confirming the order arrived on the 11th, evidence that, in the jury's reading, proved the work began before the contract.",
    "Beneath the statistics lay a quieter story. Between 2019 and 2024, the region lost 340 farms; consolidation, debt, and shifting trade patterns each played a part, yet the survivors shared something the reports seldom mentioned, namely family members who returned.",
    "The handbook, now in its fifth edition, devotes three chapters to failure: how to design for it, how to detect it, and how to explain it. Reviewers praised the candor, while engineers noted that the failure budget, a concept borrowed from aerospace, deserved the attention it was finally receiving.",
    "Her lecture opened with a question nobody answered: if measurement is easy, why does progress stay slow? The audience laughed, but the evidence was sobering; across 30 comparable programs, only 11 met their own targets, and the gap, she argued, was a failure of definition.",
    "The shipment cleared customs on the 17th, three days late, and the delay rippled through the schedule: the assembly line waited, the retailer's promotion slipped, and the launch moved to the following Tuesday, a shifting chain that cost the distributor 41,000 in discounts and overhead.",
    "Two competing theories explain the town's abrupt decline. One points to the mill closing in 1987; the other traces it to the highway rerouted eight years earlier, a decision that redirected traffic, investment, and eventually whole families toward a city 30 kilometers south.",
    "The experiment failed exactly as designed, which the scientist considered a success. The hypothesis predicted a temperature rise of 0.6 degrees; the instruments recorded 0.58, comfortably within error, but the control group behaved unexpectedly, and that anomaly became the basis of a follow-up study.",
    "The community board approved the proposal with conditions: no construction before spring, a full environmental review, and a parking plan reviewed every six months. Supporters called it a fair compromise; critics dismissed the conditions as symbolic, yet the agreement survived its first fiscal year intact.",
  ],
};

// ── Deterministic variation builders ───────────────────────────────────────
// Every variation is a pure function of (type, difficulty, index), so rotation
// through the pool never shows the same slot twice until the full cycle wraps.

const BASE_LETTERS = [...'abcdefghijklmnopqrstuvwxyz'];
const DIGITS = [...'0123456789'];
const SYMBOLS = [';', ',', '.', '!', '@', '#'];

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seededShuffle = <T,>(items: T[], rand: () => number): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function keyedTokenStream(difficulty: PracticeDifficulty, keys: string[], count: number, rand: () => number): string[] {
  const focus = [...new Set(keys.map((key) => key.toLowerCase()))];
  const alphabet = [...new Set([...BASE_LETTERS, ...focus])];
  const orders = difficulty === 'beginner' ? [1, 1, 2] : difficulty === 'intermediate' ? [2, 2, 3] : [3, 3, 4];
  const symbols = difficulty === 'advanced' ? [...DIGITS, ...SYMBOLS] : [];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const order = focus.length ? orders[Math.floor(rand() * orders.length)] : 1;
    let token = '';
    for (let j = 0; j < order; j++) token += alphabet[Math.floor(rand() * alphabet.length)];
    if (focus.length && !focus.some((letter) => token.includes(letter))) token = focus[Math.floor(rand() * focus.length)];
    if (symbols.length && rand() < 0.12) token += symbols[Math.floor(rand() * symbols.length)];
    out.push(token);
  }
  return out;
}

const COMBINATION_SETS: Record<PracticeDifficulty, string[][]> = {
  beginner: [['th', 'he', 'er', 're', 'te'], ['in', 'an', 'on', 'en', 'nd'], ['at', 'ou', 'ea', 'ou', 'st'], ['or', 'ar', 'es', 'st', 'le'], ['se', 'hi', 'ha', 'li', 'lo'], ['wh', 'er', 're', 'or', 'nd']],
  intermediate: [['ing', 'tion', 'ment', 'able', 'ness'], ['th', 'he', 'er', 'in', 'an'], ['pr', 'pl', 'gl', 'gr', 'cr'], ['br', 'st', 'nt', 'nd', 'ng'], ['tr', 'ty', 'ry', 'rt', 'yr'], ['ch', 'ck', 'sh', 'ou', 'ea']],
  advanced: [['str', 'ght', 'ough', 'eigh'], ['tion', 'sion', 'ment', 'ence'], ['ex', 'pre', 'pro', 'con'], ['qu', 'ph', 'gh', 'x'], ['sh', 'ci', 'si', 'ti'], ['age', 'ible', 'ous', 'ive']],
};

function combinationVariation(difficulty: PracticeDifficulty, keys: string[], rand: () => number): string {
  let units: string[];
  if (keys.length) {
    units = keys.map((key) => key.toLowerCase());
  } else {
    const sets = COMBINATION_SETS[difficulty];
    units = sets[Math.floor(rand() * sets.length)];
  }
  const count = difficulty === 'beginner' ? 55 : difficulty === 'intermediate' ? 65 : 75;
  const tokens: string[] = [];
  for (let i = 0; i < count; i++) {
    let token = units[Math.floor(rand() * units.length)];
    if (difficulty === 'advanced' && rand() < 0.1) token = `${token}${DIGITS[Math.floor(rand() * DIGITS.length)]}`;
    tokens.push(token);
  }
  return tokens.join(' ');
}

const VARIATION_COUNTS: Record<string, number> = { word: 80, sentence: 48, paragraph: 20, character: 60, combination: 60, weak: 60 };

export function variationCount(type: string): number {
  return VARIATION_COUNTS[type] ?? 0;
}

export function variationAt(type: string, difficulty: PracticeDifficulty, focusKeys: string[], index: number): string {
  const rand = mulberry32(hashSeed(`${type}|${difficulty}|${index}`));
  switch (type) {
    case 'word':
      return seededShuffle(WORD_BANKS[difficulty], rand).slice(0, 20).join(' ');
    case 'sentence':
      return seededShuffle(SENTENCE_BANKS[difficulty], rand).slice(0, 4).join(' ');
    case 'paragraph': {
      const bank = PARAGRAPH_BANKS[difficulty];
      return bank[index % bank.length];
    }
    case 'combination':
      return combinationVariation(difficulty, focusKeys, rand);
    default:
      return keyedTokenStream(difficulty, focusKeys.length ? focusKeys : ['a', 's', 'd', 'f'], 110, rand).join(' ');
  }
}