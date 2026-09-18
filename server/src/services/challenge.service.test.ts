import assert from 'assert';
import Challenge from '../models/Challenge';
import TestParagraph from '../models/TestParagraph';
import {
  CHALLENGE_TTL_MS,
  ChallengeError,
  computeStats,
  generateCode,
  isCodeFormatValid,
  isExpired,
  playerSlotOf,
  createChallenge,
  joinChallenge,
  markReady,
  startChallengeIfReady,
  markConnected,
  markDisconnected,
  submitResults,
  leaveChallenge,
  requestRematch,
  startRematchIfBothReady,
  toPublic,
} from './challenge.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FakeDoc = any;

const store = new Map<string, FakeDoc>();

function setPath(target: any, path: string, value: unknown): void {
  const keys = path.split('.');
  let node = target;
  for (let i = 0; i < keys.length - 1; i++) {
    if (node[keys[i]] === undefined || node[keys[i]] === null) node[keys[i]] = {};
    node = node[keys[i]];
  }
  node[keys[keys.length - 1]] = value;
}

function makeChallenge(overrides: Record<string, any> = {}): FakeDoc {
  const data: Record<string, any> = {
    _id: 'TY-ABCDE',
    code: 'TY-ABCDE',
    status: 'WAITING',
    round: 1,
    player1: {
      userId: 'u1',
      username: 'alice',
      ready: false,
      connected: true,
      joinedAt: new Date(),
      readyAt: undefined,
      rematchReady: false,
      stats: null,
    },
    player2: null,
    text: 'the quick brown fox jumps over the lazy dog',
    paragraphId: 'p1',
    durationSeconds: 60,
    startAt: null,
    winner: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    ...overrides,
  };
  if (data.code) data._id = data.code;
  const doc: FakeDoc = {
    ...data,
    set(path: string, value: unknown) {
      setPath(doc, path, value);
    },
    markModified() { /* no-op */ },
    async save() {
      return doc;
    },
  };
  store.set(data.code, doc);
  return doc;
}

function typedWords(correct: number, incorrect = 0) {
  return [
    ...Array.from({ length: correct }, (_, i) => ({ word: `word${i}`, typed: `word${i}`, correct: true, timeTakenMs: 1 })),
    ...Array.from({ length: incorrect }, (_, i) => ({ word: `bad${i}`, typed: `nope${i}`, correct: false, timeTakenMs: 1 })),
  ];
}

const alice = { _id: 'u1', username: 'alice' } as any;
const bob = { _id: 'u2', username: 'bob' } as any;

// ---- fakes ----
(Challenge as any).findOne = ({ code }: { code: string }) => {
  const doc = store.get(code.toUpperCase());
  return {
    ...(doc ?? {}),
    select: () => ({
      lean: async () => (doc ? { _id: doc._id } : null),
    }),
    lean: async () => (doc ? { ...doc } : null),
  };
};
(Challenge as any).create = async (data: Record<string, any>) => {
  const doc = makeChallenge(data);
  return doc;
};
(TestParagraph as any).aggregate = async (pipeline: any[]) =>
  [{ content: 'the five boxing wizards jump quickly', _id: 'p1' }];

// Minimal atomic-update fake: honors dotted filters ($nin/$gt, nested slot
// fields, null checks) like Mongoose's findOneAndUpdate conditions.
function matchesFilter(doc: any, filter: Record<string, any>): boolean {
  for (const key of Object.keys(filter)) {
    const expected = filter[key];
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected && doc[key] !== undefined && !expected.$in.includes(doc[key])) return false;
      if ('$in' in expected && doc[key] === undefined) return false;
      if ('$nin' in expected && expected.$nin.includes(doc[key])) return false;
      if ('$gt' in expected) {
        const lhs = doc[key] instanceof Date ? doc[key].getTime() : doc[key];
        const rhs = expected.$gt instanceof Date ? expected.$gt.getTime() : expected.$gt;
        if (!(typeof lhs === 'number' && lhs > rhs)) return false;
      }
      if ('$lt' in expected) {
        const lhs = doc[key] instanceof Date ? doc[key].getTime() : doc[key];
        const rhs = expected.$lt instanceof Date ? expected.$lt.getTime() : expected.$lt;
        if (!(typeof lhs === 'number' && lhs < rhs)) return false;
      }
      continue;
    }
    const parts = key.split('.');
    let node: any = doc;
    for (const part of parts) {
      node = node?.[part];
    }
    if (expected === null) {
      if (node !== null && node !== undefined && !(node instanceof Date && false)) return false;
    } else if (String(node) !== String(expected)) return false;
  }
  return true;
}

(Challenge as any).findOneAndUpdate = async (filter: Record<string, any>, update: Record<string, any>, opts?: { new?: boolean }) => {
  const lookup = (filter.code ?? filter._id ?? '') as string;
  const doc = store.get(String(lookup).toUpperCase()) ?? null;
  if (doc && matchesFilter(doc, filter)) {
    if (opts?.new === false) return doc;
    const set = (update as { $set?: Record<string, unknown> }).$set ?? {};
    for (const path of Object.keys(set)) setPath(doc, path, set[path]);
    const inc = (update as { $inc?: Record<string, number> }).$inc ?? {};
    for (const path of Object.keys(inc)) doc[path] = (doc[path] ?? 0) + inc[path];
    return doc;
  }
  return null;
};

function assertRejects(promise: Promise<any>, message: string, statusCode?: number): Promise<void> {
  return promise.then(
    () => assert.fail(`expected rejection: ${message}`),
    (err) => {
      assert.ok(err instanceof ChallengeError, `expected ChallengeError, got ${err}`);
      assert.equal(err.message, message);
      if (statusCode !== undefined) assert.equal((err as ChallengeError).statusCode, statusCode);
    }
  );
}

// ---- computeStats ----
assert.deepEqual(computeStats([], 60), { wpm: 0, accuracy: 100, correctWords: 0, attemptedWords: 0, errorsCount: 0 });
assert.equal(computeStats(typedWords(10), 60).wpm, 10);
assert.equal(computeStats(typedWords(30), 30).wpm, 60);
assert.equal(computeStats(typedWords(52), 60).wpm, 52);
assert.equal(computeStats(typedWords(25, 3), 60).wpm, 25);
assert.equal(computeStats(typedWords(25, 3), 60).accuracy, 89.3);
assert.equal(computeStats(typedWords(25, 3), 60).errorsCount, 3);
assert.equal(computeStats(typedWords(25, 3), 60).attemptedWords, 28);
assert.equal(computeStats(typedWords(0, 5), 60).wpm, 0);
assert.equal(computeStats(typedWords(0, 5), 60).accuracy, 0);

// ---- generated codes ----
for (let i = 0; i < 50; i++) {
  const code = generateCode();
  assert.match(code, /^TY-[A-Z0-9]{5}$/);
  assert.ok(!/^TY-[01IO]/.test(code), `code must avoid 0/1/I/O: ${code}`);
  assert.equal(code.includes('0'), false);
  assert.equal(code.includes('1'), false);
  assert.equal(code.includes('I'), false);
  assert.equal(code.includes('O'), false);
}

// ---- format ----
assert.equal(isCodeFormatValid('TY-ABCDE'), true);
assert.equal(isCodeFormatValid('ty-ab1de'), true);
assert.equal(isCodeFormatValid('TY-ABC'), false);
assert.equal(isCodeFormatValid('TY-ABCDEF'), false);
assert.equal(isCodeFormatValid('abcde'), false);

// ---- expiry ----
assert.equal(isExpired(makeChallenge()), false);
assert.equal(isExpired(makeChallenge({ expiresAt: new Date(Date.now() - 1000) })), true);

// ---- playerSlotOf ----
assert.equal(playerSlotOf(makeChallenge(), 'u1'), 'player1');
assert.equal(playerSlotOf(makeChallenge(), 'nobody'), null);
assert.equal(playerSlotOf(makeChallenge({ player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), stats: null } }), 'u2'), 'player2');

// ---- createChallenge + ensureUnique + load ----
(async () => {
  const created = await createChallenge(alice, 90);
  assert.equal(created.code.includes('TY-'), true);
  assert.equal(created.status, 'WAITING');
  assert.equal(created.durationSeconds, 90);
  assert.equal(created.player1.username, 'alice');
  assert.ok(created.text.length > 0);

  const clamped = await createChallenge(alice, 10);
  assert.equal(clamped.durationSeconds, 30);
  const clampedMax = await createChallenge(alice, 500);
  assert.equal(clampedMax.durationSeconds, 300);

  // join flow
  const room = makeChallenge({ code: 'TY-JOIN1', text: 'sample paragraph text' });
  const joined = await joinChallenge(room, bob);
  assert.equal(joined.status, 'PLAYER_JOINED');
  assert.equal(joined.status, 'PLAYER_JOINED');
  assert.equal(joined.player2?.username, 'bob');
  const rejoined = await joinChallenge(joined, alice);
  assert.equal(rejoined.player2 === joined.player2, true);

  // full
  await assertRejects(joinChallenge(room, { _id: 'u3', username: 'carol' } as any), 'This challenge is already full.', 400);
  // expired
  const expiredRoom = makeChallenge({ code: 'TY-EXPIR', status: 'WAITING', expiresAt: new Date(Date.now() - 1000) });
  await assertRejects(joinChallenge(expiredRoom, bob), 'This challenge has expired.', 400);

  // markReady — atomic per-slot update, other player's flag never touched
  const readyRoom = makeChallenge({ code: 'TY-READY', status: 'PLAYER_JOINED', player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null } });
  const p1Ready = await markReady(readyRoom, alice);
  assert.equal(p1Ready.bothReady, false);
  assert.equal(p1Ready.challenge.player1.ready, true);
  assert.equal(p1Ready.challenge.player2?.ready, false);
  assert.equal(p1Ready.challenge.status, 'PLAYER_JOINED');
  const p2Ready = await markReady(readyRoom, bob);
  assert.equal(p2Ready.bothReady, true);
  assert.equal(p2Ready.challenge.player1.ready, true);
  assert.equal(p2Ready.challenge.player2?.ready, true);
  assert.equal(p2Ready.challenge.status, 'READY', 'room lifts into shared READY state when both players are ready');

  // startChallengeIfReady — exactly ONE authoritative startTime
  const startedOnce = await startChallengeIfReady('TY-READY');
  assert.ok(startedOnce, 'startChallengeIfReady should start the room');
  assert.equal(startedOnce.status, 'RUNNING');
  assert.ok(startedOnce.startAt instanceof Date);
  const startedAgain = await startChallengeIfReady('TY-READY');
  assert.equal(startedAgain, null, 'second call must not create another startTime');

  // markConnected / markDisconnected — reconnection recovery
  const dc = await markDisconnected(readyRoom, 'u1');
  assert.equal(dc.player1.connected, false);
  const rc = await markConnected(dc, 'u1');
  assert.equal(rc.player1.connected, true);

  await assertRejects(
    markReady(makeChallenge({ code: 'TY-STANG' }), { _id: 'u9', username: 'x' } as any),
    'You are not part of this challenge.',
    403
  );

  // submitResults — opponent already submitted → final + winner
  const runningA = makeChallenge({
    code: 'TY-RUNA',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), stats: { typedWords: [], wpm: 40, accuracy: 100, correctWords: 40, attemptedWords: 40, errorsCount: 0, submittedAt: new Date() } },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), stats: null },
  });
  const resA = await submitResults(runningA, bob, typedWords(41), 1);
  assert.equal(resA.final, true);
  assert.equal(resA.abandoned, false);
  assert.equal(runningA.status, 'COMPLETED');
  assert.equal(runningA.winner, 'player2');

  // submitResults — stale round rejected (round-1 results can't touch round-2)
  const runningStale = makeChallenge({
    code: 'TY-RUNS',
    status: 'RUNNING',
    round: 2,
    startAt: new Date(Date.now() - 10000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
  });
  await assertRejects(
    submitResults(runningStale, alice, typedWords(5), 1),
    'This race has already ended.',
    400
  );
  const resStale = await submitResults(runningStale, alice, typedWords(30), 2);
  assert.equal(resStale.final, false, 'round-2 submission with a live opponent is accepted but not final');
  assert.equal(resStale.abandoned, false);
  assert.equal(runningStale.status, 'RUNNING');

  // submitResults — forfeit (opponent disconnected) → winner = me
  const runningB = makeChallenge({
    code: 'TY-RUNB',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: false, joinedAt: new Date(), stats: null },
  });
  const resB = await submitResults(runningB, alice, typedWords(30), 1);
  assert.equal(resB.final, true);
  assert.equal(resB.abandoned, true);
  assert.equal(runningB.winner, 'player1');

  // submitResults — both equal wpm and both submitted → draw
  const runningC = makeChallenge({
    code: 'TY-RUNC',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), stats: { typedWords: [], wpm: 50, accuracy: 100, correctWords: 50, attemptedWords: 50, errorsCount: 0, submittedAt: new Date() } },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), stats: null },
  });
  await submitResults(runningC, bob, typedWords(50), 1);
  assert.equal(runningC.status, 'COMPLETED');
  assert.equal(runningC.winner, null);

  // submitResults — not running → reject
  await assertRejects(
    submitResults(makeChallenge({ code: 'TY-RUND', status: 'WAITING', player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null } }), bob, typedWords(5), 1),
    'This challenge is not running.',
    400
  );

  // leaveChallenge
  const leaveWaiting = makeChallenge({ code: 'TY-LEAV1' });
  const leftWaiting = await leaveChallenge(leaveWaiting, 'u1');
  assert.equal(leftWaiting.status, 'EXPIRED');

  const leaveRunning = makeChallenge({
    code: 'TY-LEAV2',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 5000),
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
  });
  const leftRunning = await leaveChallenge(leaveRunning, 'u1');
  assert.equal(leftRunning.status, 'RUNNING');
  assert.equal(leftRunning.player1.connected, false);

  // requestRematch / startRematchIfBothReady — two-step race-safe rematch
  await assertRejects(
    requestRematch(makeChallenge({ code: 'TY-REMA1', status: 'WAITING' }), alice),
    'A rematch is only available after a finished challenge.',
    400
  );
  const completed = makeChallenge({
    code: 'TY-REMA2',
    status: 'COMPLETED',
    round: 1,
    winner: 'player1',
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: { typedWords: [], wpm: 44, accuracy: 100, correctWords: 44, attemptedWords: 44, errorsCount: 0, submittedAt: new Date() } },
    player2: { userId: 'u2', username: 'bob', ready: true, connected: true, joinedAt: new Date(), rematchReady: false, stats: { typedWords: [], wpm: 33, accuracy: 100, correctWords: 33, attemptedWords: 33, errorsCount: 0, submittedAt: new Date() } },
  });

  // One player requesting alone must NOT start a new round.
  const flagged = await requestRematch(completed, alice);
  assert.equal(flagged.status, 'COMPLETED');
  assert.equal(flagged.player1.rematchReady, true);
  assert.equal(flagged.player2?.rematchReady, false);
  assert.equal(flagged.round, 1);
  assert.equal(await startRematchIfBothReady('TY-REMA2', { content: 'fresh round text two', _id: 'p2' } as any), null, 'round must not start until BOTH players ask');

  // Second player requests → both flags set → EXACTLY ONE next round starts.
  await requestRematch(completed, bob);
  const advanced = await startRematchIfBothReady('TY-REMA2', { content: 'fresh round text two', _id: 'p2' } as any);
  assert.ok(advanced, 'both rematch flags set → next round must start');
  assert.equal(advanced.round, 2);
  assert.equal(advanced.status, 'PLAYER_JOINED');
  assert.equal(advanced.winner, null);
  assert.equal(advanced.startAt, null);
  assert.equal(advanced.text, 'fresh round text two');
  assert.equal(advanced.paragraphId, 'p2');
  assert.equal(advanced.player1.rematchReady, false);
  assert.equal(advanced.player2?.rematchReady, false);
  assert.equal(advanced.player1.stats, null);
  assert.equal(advanced.player2?.stats, null);
  assert.equal(advanced.player1.ready, false);
  assert.equal(advanced.player2?.ready, false);

  // Race-safety: a second (concurrent) advance call gets null — no duplicate
  // round, no duplicate text, no round-3 impostor.
  const secondAdvance = await startRematchIfBothReady('TY-REMA2', { content: 'a different paragraph', _id: 'p3' } as any);
  assert.equal(secondAdvance, null, 'second concurrent advance must not create another round');
  assert.equal(advanced.round, 2, 'round must stay 2 after the losing concurrent call');

  // Rematch round is a fresh lobby: ready flags cleared, ready to ready-up.
  const p1Ready2 = await markReady(advanced, alice);
  assert.equal(p1Ready2.bothReady, false);
  const p2Ready2 = await markReady(advanced, bob);
  assert.equal(p2Ready2.challenge.status, 'READY');
  assert.equal(p2Ready2.challenge.round, 2);
  const restarted = await startChallengeIfReady('TY-REMA2');
  assert.equal(restarted?.status, 'RUNNING');
  assert.equal(restarted?.round, 2);

  // toPublic
  const pubWaiting = toPublic(makeChallenge({ code: 'TY-PUB1' }), 'u1');
  assert.equal(pubWaiting.me, 'player1');
  assert.equal(pubWaiting.code, 'TY-PUB1');
  assert.equal(pubWaiting.status, 'WAITING');
  assert.equal(pubWaiting.round, 1);
  assert.equal(pubWaiting.players.length, 1);
  assert.equal(pubWaiting.players[0].stats, null);
  assert.equal(pubWaiting.players[0].rematchReady, false);
  const pubDone = toPublic(makeChallenge({
    code: 'TY-PUB2',
    status: 'COMPLETED',
    round: 3,
    winner: 'player1',
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: { typedWords: [], wpm: 44, accuracy: 90, correctWords: 44, attemptedWords: 50, errorsCount: 6, submittedAt: new Date() } },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: true, stats: null },
  }), 'u2');
  assert.equal(pubDone.me, 'player2');
  assert.equal(pubDone.winner, 'player1');
  assert.equal(pubDone.round, 3);
  assert.equal(pubDone.players[0].stats?.wpm, 44);
  assert.equal(pubDone.players[1].rematchReady, true);
  assert.equal(pubDone.startAt, null);
})().then(
  () => console.log('challenge.service tests passed'),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);