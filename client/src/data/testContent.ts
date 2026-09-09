// Difficulty-driven, grammatical English content for typing tests.
// Every chunk is a pure function of its options (rotation included), so
// advancing the rotation never repeats a chunk and every chunk reads like
// natural English instead of a random word collection.
//
// Difficulty separation (by design, verified by test-content-ui-check.js):
//   Easy   — very common short words (2-6 letters), 4-7 word sentences,
//            simple subject-verb structure, periods and occasional questions only.
//   Medium — common + moderately varied vocabulary, longer sentences, commas,
//            infinitives, compounds — noticeably more typing effort than Easy.
//   Hard   — long, complex sentences, advanced vocabulary, quotes, colons,
//            semicolons, serial lists.

export type TestDifficulty = 'simple' | 'medium' | 'hard';

type Rng = () => number;
type Template = (opts: GenerateTestChunkOptions, r: Rng) => string;

export interface GenerateTestChunkOptions {
  difficulty: TestDifficulty;
  wordCount: number;
  includeNumbers?: boolean;
  includePunctuation?: boolean;
  rotation: number;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: readonly T[], r: Rng): T {
  return arr[Math.floor(r() * arr.length)];
}

function seededShuffle<T>(items: readonly T[], r: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function num(r: Rng, lo: number, hi: number): string {
  return String(lo + Math.floor(r() * (hi - lo + 1)));
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

function templateCycle(templates: readonly Template[], r: Rng) {
  let pool = seededShuffle(templates, r);
  let i = 0;
  return (opts: GenerateTestChunkOptions, rr: Rng): string => {
    if (i >= pool.length) {
      pool = seededShuffle(templates, rr);
      i = 0;
    }
    return pool[i++](opts, rr);
  };
}

// ── Easy (simple): very common words, short sentences, minimal punctuation ──
const EASY_SG = ['cat','dog','bird','fish','hen','pig','cow','goat','bear','deer','horse','sheep','mouse','duck','rabbit','tree','rose','leaf','seed','egg','cake','bread','soup','milk','corn','meat','ball','kite','book','pen','bag','cap','hat','shoe','sock','coat','box','cup','mat','bed','desk','gate','wall','door','car','bus','van','boat','bike','train','park','lake','pond','hill','field','road','path','shop','store','home','house','room','yard'] as const;
const EASY_ADJ = ['red','blue','green','black','white','brown','pink','gray','big','small','hot','cold','new','old','fast','slow','wet','dry','soft','hard','light','dark','full','clean','warm','cool','kind','good','calm','sweet','fresh','quiet','short','long','tall','thin','young','glad','sad','happy'] as const;
const EASY_V_BASE = ['like','want','have','hold','love','need','see','hear','find','make','play','sing','run','walk','eat','cook','read','sit','wait','take','give','bring','ride','swim','draw','jump','help','build'] as const;
const EASY_V_S = ['likes','wants','has','holds','loves','needs','sees','hears','finds','makes','plays','sings','runs','walks','eats','cooks','reads','sits','waits','takes','gives','brings','rides','swims','draws','jumps','helps','builds'] as const;
const EASY_PL = ['birds','dogs','cats','fish','ducks','hens','cows','goats','sheep','mice','roses','leaves','seeds','eggs','balls','kites','books','pens','bags','caps','hats','shoes','socks','coats','cars','buses','boats','bikes','trains','trees','stars','clouds'] as const;
const EASY_PREP = ['on the mat','on the bed','on the desk','on the grass','in the box','in the lake','in the park','in the yard','in the house','under the tree','under the bed','by the door','by the lake','next to the car','next to the house','near the park','at the park','over the hill','in the rain','in the sun'] as const;
const EASY_PLACE = ['outside','together','now','here','today','in the park','by the lake','under the tree','on the grass','after lunch','before dark','with my friend'] as const;
const EASY_HUMAN = ['He','She','Tom','Ann','Pat','Ben','Mia','Tim','Sam','Max','My mom','My dad','My friend','My brother','My sister'] as const;
const EASY_REL = ['my good friend','my best friend','my big brother','my little sister','my old pal','a very good friend'] as const;
const EASY_FAM = ['mom','dad','friend','brother','sister','dog','cat','son','girl','boy'] as const;

// ── Medium (intermediate): common + varied vocabulary, longer sentences ─────
const MED_SUBJ_PL = ['The students','The children','The workers','The drivers','The coaches','The parents','The neighbors','The players'] as const;
const MED_ROLE_S = ['teacher','writer','student','coach','nurse','chef','driver','farmer','reader','runner','helper','cousin'] as const;
const MED_OBJ = ['project','meeting','journey','camera','method','report','plan','schedule','lesson','letter','message','story','picture','garden','chapter','pattern'] as const;
const MED_OBJ_PL = ['books','letters','papers','lessons','stories','plans','reports','notes','maps'] as const;
const MED_V_BASE = ['read','write','teach','learn','practice','prepare','cook','plant','water','buy','bring','take','open','close','repair','build','start','finish','improve','choose','save','grow','check','meet','visit','travel','type','review'] as const;
const MED_V_S = ['reads','writes','teaches','learns','practices','prepares','cooks','plants','waters','buys','brings','takes','opens','closes','repairs','builds','starts','finishes','improves','chooses','saves','grows','checks','meets','visits','travels','types','reviews'] as const;
const MED_PLACE = ['in the office','in the library','in the garden','in the kitchen','in the station','in the market','near the river','beside the road','at the school','at the museum','in the classroom','on the platform','next to the bridge'] as const;
const MED_PLACE_DAY = ['in the office','in the library','in the kitchen','in the station','in the market','at the school','at the museum','in the classroom'] as const;
const MED_TIME = ['in the morning','in the afternoon','in the evening','after lunch','after work','on weekdays','before class','each day'] as const;
const MED_FREQ = ['week','month','morning','afternoon','term','season'] as const;
const MED_EVENT = ['the bell rang','the bus arrived','the class began','the rain stopped','the door opened','the meeting ended','the test started'] as const;
const MED_AFFIRM = ['smiled','nodded','cheered','applauded','agreed'] as const;
const MED_SUBJ_S = ['the teacher','the coach','the nurse','the reader','the driver','the student'] as const;
const MED_ADJ = ['ready','careful','patient','polite','honest','clever','lucky','brave','steady','calm'] as const;
const MED_NAME = ['Sam','Mia','Ann','Tom','Ben','Pat','Leo','Eva'] as const;
const MED_GOODNOUN = ['practice','plan','routine','habits','feedback','focus'] as const;
const MED_GOODNOUN2 = ['careful focus','patient practice','steady effort','honest feedback','good planning','regular habits'] as const;
const MED_IMPR = ['improve','strengthen','build','support','reward'] as const;
const MED_WITH = ['fewer mistakes','more speed','better focus','less stress','more care','real progress'] as const;
const MED_DAY = ['Monday','Tuesday','Wednesday','Thursday','Friday'] as const;
const MED_COUNT = ['packages','items','pages','letters','boxes','meters','entries','samples'] as const;

// ── Hard (advanced): long/complex sentences, advanced vocabulary ────────────
const HARD_SUBJ = ['the committee','the author','the researchers','the commission','the director','the analyst','the board','the engineer','the panel','the editor','the strategist','the supervisor','the reviewers'] as const;
const HARD_V = ['examined','acknowledged','demonstrated','observed','committed','challenged','identified','established','confirmed','hypothesized','eliminated','facilitated','implemented','documented','verified','summarized'] as const;
const HARD_OBJ = ['methodology','framework','proposal','evidence','hypothesis','protocol','assessment','procedure','criterion','assumption','requirement','contingency'] as const;
const HARD_ADJ = ['significant','comprehensive','ambiguous','unprecedented','fundamental','extraordinary','substantial','theoretical','practical','systematic','inevitable','provisional'] as const;
const HARD_PHR = ['across the organization','throughout the review period','against the baseline','under the revised schedule','from the initial cohort','within the designated budget','beyond the original scope'] as const;
const HARD_CLAUSE = [
  'the findings remained difficult to interpret',
  'the results matched the earlier estimate',
  'the margin narrowed after the second reading',
  'the proposed change conflicted with the mandate',
  'the available data supported a cautious approach',
  'the review uncovered several unanswered questions',
  'the timeline kept shifting without notice',
  'the evidence pointed to a single cause',
] as const;
const HARD_DETAIL = ['was drafted in nine days','had been revised twice','remained contested throughout','was submitted without comment','seldom attracted attention','was presented without its appendix'] as const;
const HARD_V2 = ['undermined','advanced','reshaped','strengthened','delayed','transformed','clarified','overhauled'] as const;
const HARD_V3 = ['argued','insisted','cautioned','emphasized','concluded','reminded','observed'] as const;
const HARD_QUOTE = ['The evidence, taken as a whole, is persuasive','Every assumption deserves a second look','The approach must change before March','Context matters more than the headline','We cannot ignore the broader picture','The margin for error is simply too narrow'] as const;
const HARD_TIMESPAN = ['the first quarter','the academic term','the fiscal year','the review period','the second phase','the three-year window'] as const;
const HARD_UNITS3 = ['participants','households','entries','interviews','procedures'] as const;

// ── Sentence templates ─────────────────────────────────────────────────────
const EASY_TEMPLATES: readonly Template[] = [
  // "The cat is on the mat."
  (o, r) => `The ${pick(EASY_SG, r)} is ${pick(EASY_PREP, r)}.`,
  // "The sun is warm."
  (o, r) => `The ${pick(EASY_SG, r)} is ${pick(EASY_ADJ, r)}.`,
  // "I like this book."
  (o, r) => `I ${pick(EASY_V_BASE, r)} this ${pick(EASY_SG, r)}.`,
  // "She has a red bag."
  (o, r) => `${pick(EASY_HUMAN, r)} has a ${pick(EASY_ADJ, r)} ${pick(EASY_SG, r)}.`,
  // "We can play outside."
  (o, r) => `We can ${pick(EASY_V_BASE, r)} ${pick(EASY_PLACE, r)}.`,
  // "He is my good friend."
  (o, r) => `${pick(EASY_HUMAN, r)} is ${pick(EASY_REL, r)}.`,
  (o, r) => `My ${pick(EASY_FAM, r)} ${pick(EASY_V_S, r)} the ${pick(EASY_SG, r)}.`,
  // "The birds are small."
  (o, r) => `The ${pick(EASY_PL, r)} are ${pick(EASY_ADJ, r)}.`,
  // "I wait in the park."
  (o, r) => `I ${pick(EASY_V_BASE, r)} ${pick(EASY_PLACE, r)}.`,
  // "Do you like the dog?"
  (o, r) => `Do you ${pick(EASY_V_BASE, r)} the ${pick(EASY_SG, r)}?`,
  (o, r) => `${pick(EASY_HUMAN, r)} ${pick(EASY_V_S, r)} by the ${pick(EASY_SG, r)}.`,
  // "They play together."
  (o, r) => `They ${pick(EASY_V_BASE, r)} ${pick(EASY_PLACE, r)}.`,
  // "We have a new car."
  (o, r) => `We have a ${pick(EASY_ADJ, r)} ${pick(EASY_SG, r)}.`,
  (o, r) => `${pick(EASY_HUMAN, r)} ${pick(EASY_V_S, r)} ${pick(EASY_PREP, r)}.`,
];

const MEDIUM_TEMPLATES: readonly Template[] = [
  // "The students are ready to start their class."
  (o, r) => `${pick(MED_SUBJ_PL, r)} are ${pick(MED_ADJ, r)} to ${pick(MED_V_BASE, r)} their ${pick(MED_OBJ, r)}.`,
  // "She likes to read books in her free time."
  (o, r) => `She likes to ${pick(MED_V_BASE, r)} ${pick(MED_OBJ_PL, r)} in her free time.`,
  // "Good practice can help you type with fewer mistakes."
  (o, r) => `Good ${pick(MED_GOODNOUN, r)} can help you ${pick(MED_V_BASE, r)} with ${pick(MED_WITH, r)}.`,
  (o, r) => `The ${pick(MED_ROLE_S, r)} ${pick(MED_V_S, r)} the ${pick(MED_OBJ, r)} ${pick(MED_PLACE, r)}.`,
  (o, r) => `${pick(MED_NAME, r)} ${pick(MED_V_S, r)} the ${pick(MED_OBJ, r)} ${pick(MED_PLACE, r)}, and everyone ${pick(MED_AFFIRM, r)}.`,
  (o, r) => `Before ${pick(MED_EVENT, r)}, the ${pick(MED_ROLE_S, r)} ${pick(MED_V_S, r)} the ${pick(MED_OBJ, r)} ${pick(MED_PLACE, r)}.`,
  (o, r) => `Every ${pick(MED_FREQ, r)}, the ${pick(MED_ROLE_S, r)} ${pick(MED_V_S, r)} the ${pick(MED_OBJ, r)} ${pick(MED_PLACE, r)}.`,
  (o, r) => `The ${pick(MED_ROLE_S, r)} ${pick(MED_V_S, r)} the ${pick(MED_OBJ, r)} ${pick(MED_PLACE, r)}, and then ${pick(MED_SUBJ_S, r)} ${pick(MED_V_S, r)} the ${pick(MED_OBJ, r)} ${pick(MED_PLACE, r)}.`,
  (o, r) => `Good ${pick(MED_GOODNOUN, r)} and ${pick(MED_GOODNOUN2, r)} ${pick(MED_IMPR, r)} the ${pick(MED_OBJ, r)} ${pick(MED_PLACE, r)}.`,
  (o, r) => `${pick(MED_SUBJ_PL, r)} ${pick(MED_V_BASE, r)} ${pick(MED_OBJ_PL, r)} ${pick(MED_TIME, r)}.`,
  (o, r) => `The ${pick(MED_ROLE_S, r)} ${pick(MED_V_S, r)} the ${pick(MED_OBJ, r)} ${pick(MED_PLACE_DAY, r)} on ${pick(MED_DAY, r)}.`,
  (o, r) => `${pick(MED_NAME, r)} ${pick(MED_V_S, r)} ${pick(MED_OBJ_PL, r)} ${pick(MED_TIME, r)}.`,
];

const HARD_TEMPLATES: readonly Template[] = [
  (o, r) => `Although ${pick(HARD_CLAUSE, r)}, the ${pick(HARD_ADJ, r)} ${pick(HARD_OBJ, r)} ${pick(HARD_V, r)} ${pick(HARD_PHR, r)}.`,
  (o, r) => `The ${pick(HARD_ADJ, r)} ${pick(HARD_OBJ, r)} ${pick(HARD_V, r)} ${pick(HARD_PHR, r)}; however, ${pick(HARD_CLAUSE, r)}.`,
  (o, r) => {
    const adj = pick(HARD_ADJ, r);
    return `${article(adj).charAt(0).toUpperCase()}${article(adj).slice(1)} ${adj} ${pick(HARD_OBJ, r)}, which ${pick(HARD_DETAIL, r)}, ${pick(HARD_V2, r)} the ${pick(HARD_OBJ, r)} ${pick(HARD_PHR, r)}.`;
  },
  (o, r) => `${pick(HARD_SUBJ, r)} ${pick(HARD_V3, r)} that ${pick(HARD_CLAUSE, r)}, adding that ${pick(HARD_CLAUSE, r)} ${pick(HARD_PHR, r)}.`,
  (o, r) => `"${pick(HARD_QUOTE, r)}," ${pick(HARD_SUBJ, r)} said, noting that ${pick(HARD_CLAUSE, r)}.`,
  (o, r) => `While ${pick(HARD_CLAUSE, r)}, ${pick(HARD_CLAUSE, r)}; consequently, ${pick(HARD_CLAUSE, r)} ${pick(HARD_PHR, r)}.`,
  (o, r) => `The ${pick(HARD_ADJ, r)} ${pick(HARD_OBJ, r)} ${pick(HARD_V, r)} ${pick(HARD_PHR, r)}: ${pick(HARD_CLAUSE, r)}.`,
  (o, r) => `${pick(HARD_SUBJ, r)} ${pick(HARD_V, r)} the ${pick(HARD_OBJ, r)} over ${pick(HARD_TIMESPAN, r)}, and the ${pick(HARD_OBJ, r)} ${pick(HARD_V, r)} ${pick(HARD_PHR, r)}.`,
  // Serial list with commas: "the methodology, the framework, and the proposal".
  (o, r) => {
    const a = pick(HARD_OBJ, r);
    const b = pick(HARD_OBJ, r);
    const c = pick(HARD_OBJ, r);
    return `${pick(HARD_SUBJ, r)} ${pick(HARD_V, r)} the ${a}, the ${b}, and the ${c} ${pick(HARD_PHR, r)}.`;
  },
];

function numberSentence(opts: GenerateTestChunkOptions, r: Rng): string {
  if (opts.difficulty === 'simple') {
    return `There are ${num(r, 2, 9)} ${pick(EASY_PL, r)} ${pick(EASY_PREP, r)}.`;
  }
  if (opts.difficulty === 'medium') {
    return `The ${pick(MED_ROLE_S, r)} ${pick(MED_V_S, r)} ${num(r, 8, 96)} ${pick(MED_COUNT, r)} ${pick(MED_PLACE, r)}.`;
  }
  return `${pick(HARD_SUBJ, r)} ${pick(HARD_V, r)} the ${pick(HARD_OBJ, r)} ${pick(HARD_PHR, r)}, and the count rose to ${num(r, 24, 480)} ${pick(HARD_UNITS3, r)} ${pick(HARD_PHR, r)}.`;
}

function templatesFor(opts: GenerateTestChunkOptions): readonly Template[] {
  if (opts.difficulty === 'simple') return EASY_TEMPLATES;
  if (opts.difficulty === 'medium') return MEDIUM_TEMPLATES;
  return HARD_TEMPLATES;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\s+([.,;:?!])/g, '$1').trim();
}

export function generateTestChunk(opts: GenerateTestChunkOptions): string {
  const r = mulberry32(hashSeed(`${opts.difficulty}|${opts.includeNumbers ? 1 : 0}|${opts.includePunctuation ? 1 : 0}|${opts.rotation}`));
  const next = templateCycle(templatesFor(opts), r);
  const sentences: string[] = [];
  let budget = Math.max(6, Math.floor(opts.wordCount));
  while (budget > 0) {
    const sentence = next(opts, r);
    sentences.push(sentence);
    budget -= sentence.split(' ').length;
  }
  if (opts.includeNumbers) {
    const count =
      opts.difficulty === 'hard' ? Math.max(1, Math.floor(sentences.length * 0.3))
      : opts.difficulty === 'medium' ? Math.max(1, Math.floor(sentences.length * 0.15))
      : Math.max(1, Math.floor(sentences.length * 0.1));
    for (let i = 0; i < count; i++) {
      const at = Math.min(sentences.length - 1, Math.floor(r() * sentences.length));
      sentences.splice(at, 0, numberSentence(opts, r));
    }
  }
  return normalize(sentences.join(' '));
}