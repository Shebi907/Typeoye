"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MASTERY_TEXTS = exports.ADVANCED_TEXTS = exports.DIGRAPH_SETS = exports.HARD_WORDS = exports.MEDIUM_WORDS = exports.EASY_WORDS = exports.COMBINATION_WORDS = exports.ROW_WORDS = exports.BOTTOM_ROW_KEYS = exports.TOP_ROW_KEYS = exports.HOME_ROW_KEYS = void 0;
exports.seededShuffle = seededShuffle;
exports.seedFor = seedFor;
exports.buildContentSets = buildContentSets;
const TestParagraph_1 = __importDefault(require("../models/TestParagraph"));
// ── Deterministic pseudo-random helpers ────────────────────────────────────
function hashString(input) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function seededRng(seed) {
    let a = hashString(seed) || 1;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function seededShuffle(items, seed) {
    const rand = seededRng(seed);
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
function pickSeeded(items, rand) {
    return items[Math.floor(rand() * items.length)];
}
function seedFor(exerciseId, contentIndex, salt = '') {
    return `${exerciseId.toString()}:${contentIndex}:${salt}`;
}
// ── Curated vocabulary, organized so content always matches the lesson ─────
exports.HOME_ROW_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];
exports.TOP_ROW_KEYS = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
exports.BOTTOM_ROW_KEYS = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
exports.ROW_WORDS = {
    'home-row': [
        'all', 'ask', 'add', 'dad', 'fall', 'fad', 'flask', 'glass', 'glad', 'hall',
        'half', 'had', 'lad', 'lash', 'sad', 'salad', 'dash', 'shad', 'alf', 'als',
        'fall', 'flag', 'kala', 'ladd', 'halls', 'asks', 'flags', 'flash', 'shall', 'slas',
    ],
    'top-row': [
        'type', 'write', 'quick', 'quit', 'quiet', 'your', 'wire', 'route', 'pure',
        'tire', 'tree', 'yet', 'tip', 'top', 'put', 'pretty', 'quote', 'pretty',
        'outer', 'teary', 'together', 'pout', 'roy', 'quit', 'yore', 'wore', 'quote', 'tripe', 'tri', 'wry',
    ],
    'bottom-row': [
        'zinc', 'buzz', 'can', 'crab', 'cave', 'comb', 'bomb', 'cabin', 'comic',
        'maximum', 'venom', 'brave', 'calm', 'axe', 'box', 'cob', 'bob', 'cobweb',
        'bunny', 'commonce', 'canvas', 'banana', 'navy', 'maze', 'zen', 'cavemen',
    ],
};
exports.COMBINATION_WORDS = [
    'the', 'then', 'there', 'this', 'these', 'them', 'their', 'they', 'that',
    'with', 'which', 'when', 'where', 'while', 'what', 'who', 'why', 'he', 'her',
    'here', 'she', 'how', 'an', 'and', 'man', 'can', 'dance', 'chance', 'change',
    'er', 'her', 'ever', 'over', 'other', 'father', 'mother', 'never', 're', 'more',
    'read', 'real', 'reach', 'really', 'ready', 'on', 'one', 'only', 'once', 'long',
    'song', 'wrong', 'at', 'ate', 'late', 'state', 'great', 'eat', 'en', 'end',
    'then', 'often', 'open', 'ten', 'ti', 'time', 'ticket', 'little', 'attention',
];
exports.EASY_WORDS = [
    'cat', 'dog', 'sun', 'run', 'fun', 'red', 'big', 'hot', 'pen', 'cup',
    'map', 'bat', 'hat', 'mat', 'tap', 'nap', 'sit', 'top', 'pop', 'lot',
    'get', 'let', 'set', 'net', 'bed', 'red', 'ten', 'hen', 'men', 'den',
    'car', 'far', 'bar', 'jar', 'tar', 'cap', 'gap', 'lad', 'pad', 'sad',
];
exports.MEDIUM_WORDS = [
    'window', 'basket', 'morning', 'gentle', 'yellow', 'garden', 'silver',
    'travel', 'friend', 'simple', 'machine', 'picture', 'captain', 'modern',
    'planet', 'system', 'market', 'stream', 'bright', 'shadow', 'weather',
    'station', 'village', 'mountain', 'painting', 'project', 'current', 'private',
];
exports.HARD_WORDS = [
    'architecture', 'equilibrium', 'perspective', 'necessary', 'immediately',
    'responsibility', 'concentration', 'determination', 'extraordinary',
    'opportunity', 'circumstance', 'particularly', 'recommendation',
    'sophisticated', 'implementation', 'investigation', 'bureaucracy',
    'acknowledgment', 'characteristic', 'communication', 'encyclopedia',
];
exports.DIGRAPH_SETS = [
    ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd'],
    ['ti', 'sa', 'of', 'or', 'ly', 'io', 'es', 'nt', 'is', 'it'],
    ['as', 'ar', 'ha', 'wh', 'ou', 'ce', 'ed', 've', 'me', 'al'],
    ['ng', 'le', 'de', 'ri', 'co', 'ro', 'si', 'ne', 'ta', 'ee'],
];
const KEY_DRILL_GROUPS = {
    'home-row': ['asdf', 'jkl;', 'fjdk', 'dksa', 'fjsl', 'lsaf', 'kdjf', 'aslk'],
    'top-row': ['qwer', 'uiop', 'qweu', 'rtyi', 'opqw', 'ertu', 'yiop', 'pwre'],
    'bottom-row': ['zxcv', 'bnm', 'zxcvbn', 'nmbz', 'vcxz', 'bnmc'],
};
// ── Sentence templates (kept grammatical and generic) ──────────────────────
const SENTENCE_TEMPLATES = {
    beginner: [
        'The {adj} {noun} rests beside the {noun}.',
        'A {adj} {noun} moves across the {noun}.',
        'Every {noun} holds a {adj} {noun}.',
        'We watch the {adj} {noun} near the {noun}.',
        'The {noun} feels {adj} when the {noun} returns.',
        'Our {adj} {noun} waits for the {noun}.',
        'The {noun} is {adj} and clearly {adj}.',
        'Start with a {adj} {noun} and keep it steady.',
    ],
    intermediate: [
        'When the {adj} {noun} {verb}s, the whole {noun} seems {adj}.',
        'A {adj} {noun} usually {verb}s before the {noun} {verb}s.',
        'After the {noun} {verb}s, we {verb} the {noun} carefully.',
        'The {adj} {noun} {verb}s {plNoun} as the day grows {adj}.',
        'Typing is easier when the {adj} {noun} stays {adj}.',
        'Practice a {adj} {noun} until the movement feels {adj}.',
    ],
    advanced: [
        'A {adj} {noun} seldom {verb}s without some {plNoun} lingering nearby.',
        'Careful {noun}s and steady {plNoun} produce a {adj} result.',
        'Although the {noun} seems {adj}, consistent effort tends to {verb} it.',
        'Good typists {verb} the {adj} {noun} before they {verb} the {plNoun}.',
    ],
};
const SENTENCE_NOUNS = ['river', 'window', 'garden', 'morning', 'forest', 'village', 'engine', 'pattern', 'market', 'shadow', 'summer', 'bridge', 'letter', 'meadow', 'memory', 'quarter', 'signal'];
const SENTENCE_ADJS = ['gentle', 'steady', 'quiet', 'bright', 'calm', 'clear', 'soft', 'warm', 'fresh', 'slow', 'sharp', 'even', 'light', 'fine', 'full'];
const SENTENCE_VERBS = ['turns', 'drifts', 'settles', 'crosses', 'echoes', 'rises', 'passes', 'gathers', 'follows', 'returns'];
const SENTENCE_PLNOUNS = ['trees', 'signals', 'flowers', 'readers', 'voices', 'letters', 'routes', 'words', 'habits', 'efforts'];
function fillTemplate(template, rand) {
    const noun = () => pickSeeded(SENTENCE_NOUNS, rand);
    const adj = () => pickSeeded(SENTENCE_ADJS, rand);
    const verb = () => pickSeeded(SENTENCE_VERBS, rand);
    const plNoun = () => pickSeeded(SENTENCE_PLNOUNS, rand);
    const text = template
        .split('{adj}').join(adj())
        .split('{noun}').join(noun())
        .split('{verb}').join(verb())
        .split('{plNoun}').join(plNoun());
    return text.replace(/ {2,}/g, ' ').trim();
}
// ── Real-world / advanced curated texts with caps, punctuation, numbers ────
exports.ADVANCED_TEXTS = [
    'In 2026, a $45.50 invoice included 3 items, 8% tax, and an email: hello@example.com.',
    'Subject: Project Update! Please review version 2.1 by Friday, then send notes to team@example.com.',
    'The meeting starts at 9:30 AM in Room 214. Bring your laptop, charger, and the Q3 report.',
    'Total cost: $1,299.99 (plus $42.00 shipping). Order #A-8821 ships within 5 business days.',
    'Liam wrote, "Practice daily!" and scheduled the course from 10:00 to 11:15 M–F.',
    'Open Settings > Accounts > Security, then enable 2FA using your phone (555-0100).',
    'Please CC: alexia@example.com and BCC: finance@example.com on all RFQ emails.',
    'Sales rose 12.4% in Q1, hit $84,000 in March, and gained 8 points toward the target.',
    'Use the formula =SUM(A1:B9), press Enter, and wait for the result to appear.',
    'Her flight departs at 6:05 PM, lands at 9:40 PM, and the hotel is 2 km from baggage claim.',
    'The code is W-2739; the pin is 4820; the backup code is 7f2a-91bc.',
    'We shipped 4,200 units on 14/03/2026 and invoiced $38,610.00 to Acme Ltd.',
];
exports.MASTERY_TEXTS = [
    'Professional typing demands sustained focus across complex paragraphs, technical symbols, and rhythm that shifts without warning. Breathe evenly, keep your wrists neutral, and let precision dictate your pace.',
    'Efficiency grows by eliminating wasted motion. Every keystroke becomes intentional, economical, and precisely timed, producing smooth, professional execution that feels almost effortless.',
    'When the brain plans a sentence and the hands trust the pattern, speed follows accuracy. Interruptions fade, errors shrink, and the flow of words stabilizes into a dependable cadence.',
    'Reading ahead by three or four words gives the mind a comfortable lead. Curves, digraphs, and repeated sequences then resolve with fewer corrections and a cleaner overall rhythm.',
    'A calm posture is a quiet advantage. Relaxed shoulders, soft wrists, and a steady gaze allow the fingers to return to home position with the ease that separates smooth typists from hesitant ones.',
    'Technical writing mixes numbers, symbols, and long clauses in a single breath. Mastering that mixture builds the endurance needed for reports, code, and correspondence that arrive back to back.',
];
// ── Set builders ───────────────────────────────────────────────────────────
function keyDrillSets(keys, count, exerciseId) {
    const usable = keys.length ? keys : ['a', 's', 'd', 'f', 'j', 'k', 'l'];
    const sets = [];
    for (let i = 0; i < count; i++) {
        const rand = seededRng(seedFor(exerciseId, i, 'drill'));
        const groups = [];
        for (let g = 0; g < 18; g++) {
            const length = 3 + Math.floor(rand() * 2);
            let group = '';
            for (let c = 0; c < length; c++)
                group += pickSeeded(usable, rand);
            if (group === groups[groups.length - 1])
                g--;
            else
                groups.push(group);
        }
        sets.push(groups.join(' '));
    }
    return sets;
}
function wordSets(words, count, exerciseId, perSet = 22) {
    const base = words.length >= perSet ? words : [...words, ...words, ...words];
    const sets = [];
    for (let i = 0; i < count; i++) {
        const rand = seededRng(seedFor(exerciseId, i, 'words'));
        const out = [];
        let attempts = 0;
        while (out.length < perSet && attempts < 500) {
            attempts++;
            const word = pickSeeded(base, rand);
            if (out[out.length - 1] === word)
                continue;
            out.push(word);
        }
        sets.push(out.join(' '));
    }
    return sets;
}
function digraphSets(count, exerciseId) {
    const sets = [];
    for (let i = 0; i < count; i++) {
        const rand = seededRng(seedFor(exerciseId, i, 'digraph'));
        const set = exports.DIGRAPH_SETS[i % exports.DIGRAPH_SETS.length];
        const out = [];
        for (let x = 0; x < 24; x++) {
            const token = pickSeeded(set, rand);
            if (out[out.length - 1] === token)
                continue;
            out.push(token);
        }
        sets.push(out.join(' '));
    }
    return sets;
}
function sentenceSets(difficulty, count, exerciseId) {
    const templates = SENTENCE_TEMPLATES[difficulty];
    const sets = [];
    for (let i = 0; i < count; i++) {
        const rand = seededRng(seedFor(exerciseId, i, 'sentence'));
        const sentences = [];
        let guard = 0;
        while (sentences.length < 4 + (i % 2) && guard < 40) {
            guard++;
            const s = fillTemplate(pickSeeded(templates, rand), rand);
            const capital = s[0].toUpperCase() + s.slice(1);
            const full = capital.replace(/\.\s*\./g, '.');
            if (sentences[sentences.length - 1] !== full)
                sentences.push(full);
        }
        sets.push(sentences.join(' '));
    }
    return sets;
}
/**
 * Builds a deterministic pool of distinct content sets for an exercise.
 * Each set has its own fixed sequence (seeded), so `buildContentSets(x, n)`
 * always returns the same content for the same `n`.
 */
async function buildContentSets(exercise, lessonCategory) {
    const id = exercise._id.toString();
    const category = lessonCategory.toLowerCase();
    if (exercise.type === 'paragraph') {
        const paragraphs = await TestParagraph_1.default.find({}).lean();
        if (!paragraphs.length)
            return [];
        return paragraphs.map((p) => p.content.trim().replace(/\s+/g, ' '));
    }
    if (exercise.type === 'sentences') {
        const difficulty = exercise.difficulty >= 8 ? 'advanced' : exercise.difficulty >= 5 ? 'intermediate' : 'beginner';
        return sentenceSets(difficulty, 30, id);
    }
    if (category === 'advanced') {
        const bank = [...exports.ADVANCED_TEXTS];
        while (bank.length < 30)
            for (const t of exports.ADVANCED_TEXTS)
                if (bank.length < 30)
                    bank.push(t);
        return bank.slice(0, 30).map((t, i) => seededShuffle(t.split(' '), seedFor(id, i, 'adv')).join(' '));
    }
    if (category === 'masterclass' || category === 'mastery') {
        const bank = [...exports.MASTERY_TEXTS];
        while (bank.length < 20)
            for (const t of exports.MASTERY_TEXTS)
                if (bank.length < 20)
                    bank.push(t);
        return bank.slice(0, 20).map((t, i) => seededShuffle(t.split(' '), seedFor(id, i, 'master')).join(' '));
    }
    if (category === 'combinations') {
        const merged = [...exports.COMBINATION_WORDS, ...exports.DIGRAPH_SETS.flat()];
        return [...digraphSets(30, id), ...wordSets(merged, 30, id, 24)].slice(0, 40);
    }
    if (category === 'words') {
        const pool = exercise.difficulty >= 7 ? exports.HARD_WORDS : exercise.difficulty >= 4 ? exports.MEDIUM_WORDS : [...exports.EASY_WORDS, ...exports.MEDIUM_WORDS];
        return wordSets(pool, 30, id, 24);
    }
    // Row drills: home-row / top-row / bottom-row (and 'basics' falls back here)
    const keys = exercise.targetKeys?.length ? exercise.targetKeys : ['a', 's', 'd', 'f', 'j', 'k', 'l'];
    const normalized = new Set(keys.map((k) => k.toLowerCase().replace(';', 'l')));
    if (exercise.type === 'words') {
        const rowWords = Object.keys(exports.ROW_WORDS).find((key) => {
            const rowKeySet = new Set(exports.ROW_WORDS[key].join('').split(''));
            return [...normalized].every((k) => rowKeySet.has(k));
        });
        const pool = rowWords ? exports.ROW_WORDS[rowWords] : ['red', 'cat', 'log', 'fun', 'top', 'gel', 'sun', 'key', 'tap', 'pet', 'map', 'net', 'cap', 'joy', 'fit'];
        return wordSets(pool, 30, id, 22);
    }
    return keyDrillSets(keys, 30, id);
}
//# sourceMappingURL=lessonContent.js.map