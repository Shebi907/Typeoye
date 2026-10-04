import assert from 'assert';
import Challenge from '../models/Challenge';
import TestParagraph from '../models/TestParagraph';
import ChallengeMessage from '../models/ChallengeMessage';
import {
  CHAT_MAX_LENGTH,
  CHAT_REACTIONS,
  CHAT_STICKERS,
  ChallengeChatError,
  sanitizeChatContent,
  createChallengeChatMessage,
  listChallengeChatMessages,
} from './challengeChat.service';
import {
  CHALLENGE_TTL_MS,
  CHALLENGE_WAITING_TTL_MS,
  CHALLENGE_GRACE_MS,
  CHALLENGE_FINISH_GRACE_MS,
  DISCONNECT_GRACE_MS,
  RUNNING_DISCONNECT_GRACE_MS,
  ChallengeError,
  computeStats,
  generateCode,
  isCodeFormatValid,
  isExpired,
  playerSlotOf,
  playerPresence,
  playerIsGone,
  createChallenge,
  joinChallenge,
  loadChallengeOrThrow,
  markReady,
  startChallengeIfReady,
  markConnected,
  markDisconnected,
  submitResults,
  finalizeRunningIfDue,
  leaveChallenge,
  requestRematch,
  resolvePendingRematch,
  startRematchIfBothReady,
  REMATCH_START_DELAY_MS,
  toPublic,
  buildChallengeText,
  pickFreshText,
  usedParagraphIds,
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
    paragraphIds: [],
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
// Pool-backed aggregate fake: honors the builder's `$match._id.$nin` exclusion
// and `$sample.size` cap so duration-scaled text and no-repeat tests behave.
const FAKE_POOL = Array.from({ length: 50 }, (_, i) => ({
  content: `Test paragraph number ${i + 1} with enough words to be meaningful and reasonably sized for a typing test.`,
  _id: `p${i + 1}`,
}));
(TestParagraph as any).aggregate = async (pipeline: any[]) => {
  let docs = [...FAKE_POOL];
  for (const stage of pipeline) {
    if (stage.$match) {
      const nin = stage.$match._id?.$nin;
      if (nin) docs = docs.filter((d) => !nin.includes(d._id));
    } else if (stage.$sample?.size != null) {
      docs = docs.slice(0, stage.$sample.size);
    }
  }
  return docs;
};

// Minimal atomic-update fake: honors dotted filters ($nin/$gt, nested slot
// fields, null checks) like Mongoose's findOneAndUpdate conditions.
function matchesFilter(doc: any, filter: Record<string, any>): boolean {
  for (const key of Object.keys(filter)) {
    const expected = filter[key];
    if (key === '$or') {
      if (!expected.some((clause: Record<string, any>) => matchesFilter(doc, clause))) return false;
      continue;
    }
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
    const push = (update as { $push?: Record<string, { $each?: unknown[] }> }).$push ?? {};
    for (const path of Object.keys(push)) doc[path] = [...(doc[path] ?? []), ...(push[path].$each ?? [])];
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
assert.deepEqual(computeStats([], 60), { wpm: 0, accuracy: 0, correctWords: 0, attemptedWords: 0, errorsCount: 0 });
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

  // buildChallengeText: duration-scaled, unique, no repeats
  const oneMin = await buildChallengeText(60, []);
  assert.ok(oneMin.content.length >= 360, `1-minute text should reach the 360-char target (got ${oneMin.content.length})`);
  assert.ok(oneMin.paragraphIds.length > 0, 'text must come from paragraphs');
  const twoMin = await buildChallengeText(120, []);
  assert.ok(twoMin.content.length >= 720, `2-minute text should reach the 720-char target (got ${twoMin.content.length})`);
  const fiveMin = await buildChallengeText(300, []);
  assert.ok(fiveMin.content.length >= 1800, `5-minute text should reach the 1800-char target (got ${fiveMin.content.length})`);

  // Excluded (already-used) paragraphs must never reappear while the pool has
  // alternatives.
  const exclude = oneMin.paragraphIds.slice(0, 3);
  const fresh = await buildChallengeText(120, exclude);
  for (const id of fresh.paragraphIds) {
    assert.ok(!exclude.some((x) => String(x) === String(id)), `rebuilt text re-used excluded paragraph ${id}`);
  }

  // usedParagraphIds: prefers the accumulator, falls back to the legacy field.
  assert.deepEqual(usedParagraphIds(makeChallenge({ code: 'TY-ACC1', paragraphIds: ['p1', 'p2'] })), ['p1', 'p2']);
  assert.deepEqual(usedParagraphIds(makeChallenge({ code: 'TY-LEG1', paragraphIds: undefined, paragraphId: 'p9' })), ['p9']);

  // pickFreshText for a rematch excludes everything the challenge already used.
  const usedAny = await pickFreshText(makeChallenge({ code: 'TY-REUSE', status: 'COMPLETED', paragraphIds: ['p1', 'p2', 'p3'], text: 'old round text' }));
  for (const id of usedAny.paragraphIds) {
    assert.ok(!['p1', 'p2', 'p3'].includes(String(id)), `rematch text re-used paragraph ${id}`);
  }

  // A solo waiting room expires 10 minutes after creation, not the full half
  // hour — long enough that an invite sent over chat can still be opened and
  // signed into, short enough that an abandoned empty lobby is cleaned up.
  assert.equal(CHALLENGE_WAITING_TTL_MS, 600_000, 'the solo-lobby waiting window must be exactly 10 minutes');
  const waitingRoom = await createChallenge(alice, 60);
  const waitingTtlSkew = Math.abs(waitingRoom.expiresAt.getTime() - Date.now() - CHALLENGE_WAITING_TTL_MS);
  assert.ok(waitingTtlSkew < 5_000, `solo room should expire ~10 minutes after creation (skew ${waitingTtlSkew}ms)`);

  // An opponent sitting down cancels the waiting clock: the room is promoted to
  // the full match TTL instead of dying a moment later.
  const soloRoom = await createChallenge(alice, 60);
  const joinedSolo = await joinChallenge(soloRoom, bob);
  const matchTtlSkew = Math.abs(joinedSolo.expiresAt.getTime() - Date.now() - CHALLENGE_TTL_MS);
  assert.ok(matchTtlSkew < 5_000, `joined room should expire ~${CHALLENGE_TTL_MS}ms out (skew ${matchTtlSkew}ms)`);
  assert.equal(isExpired(joinedSolo), false, 'a room with an opponent joined must not be expired by the old waiting deadline');

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

  // submitResults / finalize — TIMER-AUTHORITATIVE: even when both players'
  // stats are present, the race must NOT finish before endAt (their clients
  // finish the text but the clock decides). First the opponent submits while
  // we are 30s short of the end: results stay open.
  const runningA = makeChallenge({
    code: 'TY-RUNA',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), stats: { typedWords: [], wpm: 40, accuracy: 100, correctWords: 40, attemptedWords: 40, errorsCount: 0, submittedAt: new Date() } },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), stats: null },
  });
  const runtimeMs = runningA.startAt.getTime() + runningA.durationSeconds * 1000;
  const resA = await submitResults(runningA, bob, typedWords(41), 1);
  assert.equal(resA.final, false, 'both stats present but now < endAt → the timer stays authoritative');
  assert.equal(resA.abandoned, false);
  assert.equal(runningA.status, 'RUNNING');

  // Still running the moment endAt arrives (both sides graded, but the clock
  // is the finish line): the winner is decided at endAt, then the race is over.
  const resAAtEnd = await finalizeRunningIfDue(runningA, runtimeMs);
  assert.equal(resAAtEnd.final, true);
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

  // submitResults — opponent gone mid-race (disconnected, no stats, grace
  // already lapsed) → NO CONTEST. Submitting first does not make you a winner:
  // the leaver is neither a winner nor the reason for a win.
  const runningB = makeChallenge({
    code: 'TY-RUNB',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: false, joinedAt: new Date(), stats: null },
  });
  const resB = await submitResults(runningB, alice, typedWords(30), 1);
  assert.equal(resB.final, true, 'opponent gone mid-race ends the room');
  assert.equal(resB.abandoned, false, 'opponent_left is not a forfeiting win');
  assert.equal(runningB.status, 'COMPLETED');
  assert.equal(runningB.endedBy, 'opponent_left');
  assert.equal(runningB.winner, null, 'a leaver never wins and never loses');
  assert.equal(runningB.abandonedBy, 'player2');
  assert.equal(runningB.player1.stats?.wpm, 30, 'the survivor keeps their local score only');

  // submitResults — both equal wpm and both submitted → draw
  const runningC = makeChallenge({
    code: 'TY-RUNC',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), stats: { typedWords: [], wpm: 50, accuracy: 100, correctWords: 50, attemptedWords: 50, errorsCount: 0, submittedAt: new Date() } },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), stats: null },
  });
  await submitResults(runningC, bob, typedWords(50), 1);
  assert.equal(runningC.status, 'RUNNING', 'equal WPM race still waits for the timer');
  const resC = await finalizeRunningIfDue(runningC, runningC.startAt.getTime() + runningC.durationSeconds * 1000 + 100);
  assert.equal(resC.final, true);
  assert.equal(runningC.status, 'COMPLETED');
  assert.equal(runningC.winner, null);

  // submitResults — not running → reject
  await assertRejects(
    submitResults(makeChallenge({ code: 'TY-RUND', status: 'WAITING', player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null } }), bob, typedWords(5), 1),
    'This challenge is not running.',
    400
  );

  // submitResults — 12s mid-race reconnection grace: an opponent that dropped
  // moments ago must NOT end the room; the race keeps waiting for them to
  // return (this is the window that makes a tab reload / wifi blip harmless).
  const runningGrace = makeChallenge({
    code: 'TY-RUNG',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: false, joinedAt: new Date(), rematchReady: false, disconnectedAt: new Date(Date.now() - 10000), stats: null },
  });
  const resGrace = await submitResults(runningGrace, alice, typedWords(30), 1);
  assert.equal(resGrace.final, false, 'opponent disconnected WITHIN grace → not final');
  assert.equal(resGrace.abandoned, false);
  assert.equal(runningGrace.status, 'RUNNING');
  assert.ok(runningGrace.player1.stats, 'survivor stats must be preserved during the grace wait');

  // …once the mid-race grace elapses the room ends as a NO CONTEST (not a
  // forfeiting win), at any point inside the race window.
  const resAfterGrace = await finalizeRunningIfDue(runningGrace, Date.now() + RUNNING_DISCONNECT_GRACE_MS + 1000);
  assert.equal(resAfterGrace.final, true);
  assert.equal(resAfterGrace.abandoned, false, 'a departure is never an abandonment win');
  assert.equal(resAfterGrace.challenge.status, 'COMPLETED');
  assert.equal(resAfterGrace.challenge.endedBy, 'opponent_left');
  assert.equal(resAfterGrace.challenge.winner, null, 'NO winner: the survivor must not be awarded the race');
  assert.equal(resAfterGrace.challenge.abandonedBy, 'player2');
  assert.equal(resAfterGrace.challenge.player2!.stats, null, 'the leaver never submits a phantom score');
  assert.equal(resAfterGrace.challenge.player1.stats?.wpm, 30, 'survivor score preserved for the local session only');

  // Reconnection beats a departure: a back-online opponent keeps the race alive.
  const runningAlive = makeChallenge({
    code: 'TY-RUNL',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, disconnectedAt: null, stats: null },
  });
  const resAlive = await submitResults(runningAlive, alice, typedWords(30), 1);
  assert.equal(resAlive.final, false, 'opponent back online → no departure');

  // An opponent who dropped but is still INSIDE the grace is not gone yet, even
  // when the survivor has already banked a score.
  const runningInsideGrace = makeChallenge({
    code: 'TY-RUNG2',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: false, joinedAt: new Date(), rematchReady: false, disconnectedAt: new Date(Date.now() - (RUNNING_DISCONNECT_GRACE_MS - 2000)), stats: null },
  });
  const resInsideGrace = await submitResults(runningInsideGrace, alice, typedWords(30), 1);
  assert.equal(resInsideGrace.final, false, 'still inside the 12s window → race keeps waiting');
  assert.equal(runningInsideGrace.status, 'RUNNING');

  // A player who already submitted has FINISHED the race: their browser
  // disconnecting afterwards is normal end-of-race behaviour and must never
  // void a legitimately completed race as opponent_left.
  const runningSubmittedGone = makeChallenge({
    code: 'TY-RUNS2',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 30000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: false, joinedAt: new Date(), rematchReady: false, disconnectedAt: new Date(Date.now() - 60000), stats: { typedWords: [], wpm: 10, accuracy: 90, correctWords: 10, attemptedWords: 10, errorsCount: 1, submittedAt: new Date() } },
  });
  const resSubmittedGone = await finalizeRunningIfDue(runningSubmittedGone, Date.now());
  assert.equal(resSubmittedGone.final, false, 'a submitted player going offline is not a departure');
  assert.equal(runningSubmittedGone.status, 'RUNNING');
  const resSubmittedGoneEnd = await finalizeRunningIfDue(runningSubmittedGone, runningSubmittedGone.startAt.getTime() + runningSubmittedGone.durationSeconds * 1000 + CHALLENGE_FINISH_GRACE_MS + 100);
  assert.equal(resSubmittedGoneEnd.final, true);
  assert.notEqual(resSubmittedGoneEnd.challenge.endedBy, 'opponent_left', 'a submitted player going offline is not a departure');
  assert.equal(resSubmittedGoneEnd.challenge.endedBy, 'abandoned', 'the normal timer path still decides the race');
  assert.equal(resSubmittedGoneEnd.challenge.winner, 'player2', 'the player who banked a score still wins');

  // submitResults — opponent connected but never submits: results must open
  // only after the finish grace expires past endAt (no early "waiting" exit),
  // then the submitter wins and the non-submitter is zeroed.
  const runningGraded = makeChallenge({
    code: 'TY-RNGF',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 10000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, disconnectedAt: null, stats: null },
  });
  const runningGradedEnd = runningGraded.startAt.getTime() + runningGraded.durationSeconds * 1000;
  const resGraded = await submitResults(runningGraded, alice, typedWords(25), 1);
  assert.equal(resGraded.final, false);
  assert.equal(runningGraded.status, 'RUNNING');
  const resGradedAtEnd = await finalizeRunningIfDue(runningGraded, runningGradedEnd);
  assert.equal(resGradedAtEnd.final, false, 'even at endAt the opponent gets the finish grace');
  const resGradedGrace = await finalizeRunningIfDue(runningGraded, runningGradedEnd + CHALLENGE_FINISH_GRACE_MS + 100);
  assert.equal(resGradedGrace.final, true, 'finish grace lapsed → race over');
  assert.equal(resGradedGrace.abandoned, true);
  assert.equal(resGradedGrace.challenge.status, 'COMPLETED');
  assert.equal(resGradedGrace.challenge.winner, 'player1');
  assert.equal(resGradedGrace.challenge.endedBy, 'abandoned');
  assert.equal(resGradedGrace.challenge.abandonedBy, 'player2');
  assert.equal(resGradedGrace.challenge.player2!.stats?.wpm, 0, 'non-submitter is zeroed, no phantom win');
  assert.equal(resGradedGrace.challenge.player1.stats?.wpm, 25, 'submitter score preserved');

  // submitResults — duplicate submission after the race was already finalized
  // must be rejected (no double counting / double phase switch client-side).
  await assertRejects(submitResults(runningA, alice, typedWords(10), 1), 'This challenge is not running.', 400);

  // Nobody submitted and the race window lapsed → EXPIRED, no winner.
  const runningTimedOut = makeChallenge({
    code: 'TY-RUNT',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 90000),
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
  });
  const resTimedOut = await finalizeRunningIfDue(runningTimedOut, Date.now() + CHALLENGE_GRACE_MS + 1000);
  assert.equal(resTimedOut.challenge.status, 'COMPLETED',
    'a STARTED race that nobody scored never becomes a lobby expiry');
  assert.equal(resTimedOut.challenge.winner, null);
  assert.equal(resTimedOut.challenge.endedBy, 'expired');
  assert.notEqual(resTimedOut.challenge.status, 'EXPIRED',
    'EXPIRED would render "no opponent joined", which is a lie for a started race');

  // loadChallengeOrThrow: a lapsed deadline only kills a SOLO lobby. A room that
  // already has an opponent must load as-is, otherwise a stale `expiresAt` makes
  // the joiner vanish mid-match and the survivor read an expiry.
  const lapsed = new Date(Date.now() - 5_000);
  const soloPast = makeChallenge({ code: 'TY-SOLOP', status: 'WAITING', player2: null, expiresAt: lapsed });
  await loadChallengeOrThrow('TY-SOLOP');
  assert.equal(soloPast.status, 'EXPIRED', 'an empty lobby past its deadline expires on load');

  const seatedPast = makeChallenge({
    code: 'TY-SEATP', status: 'PLAYER_JOINED', expiresAt: lapsed,
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
  });
  const reloadedSeated = await loadChallengeOrThrow(seatedPast.code);
  assert.equal(reloadedSeated.status, 'PLAYER_JOINED', 'a room with an opponent is never expired just for being past the waiting window');

  // leaveChallenge
  const leaveWaiting = makeChallenge({ code: 'TY-LEAV1' });
  const leftWaiting = await leaveChallenge(leaveWaiting, 'u1');
  assert.equal(leftWaiting.status, 'EXPIRED');

  // …but a SOLO lobby is the ONLY thing that may ever be EXPIRED. The moment an
  // opponent is seated, walking away before the start is a DEPARTURE: the
  // survivor must be released as a no contest instead of being told that
  // nobody joined them.
  const leaveSeated = makeChallenge({
    code: 'TY-LEAV1B',
    status: 'PLAYER_JOINED',
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
  });
  const leftSeated = await leaveChallenge(leaveSeated, 'u1');
  assert.equal(leftSeated.status, 'COMPLETED', 'leaving a room with an opponent is not a lobby expiry');
  assert.equal(leftSeated.endedBy, 'opponent_left');
  assert.equal(leftSeated.winner, null, 'the pre-start survivor never wins by default');
  assert.equal(leftSeated.abandonedBy, 'player1');

  // Same for the opponent walking out of a room that is only READY.
  const leaveReady = makeChallenge({
    code: 'TY-LEAV1C',
    status: 'READY',
    player1: { userId: 'u1', username: 'alice', ready: true, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: true, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
  });
  const leftReady = await leaveChallenge(leaveReady, 'u2');
  assert.equal(leftReady.status, 'COMPLETED');
  assert.equal(leftReady.endedBy, 'opponent_left');
  assert.equal(leftReady.abandonedBy, 'player2');

  // leaveChallenge on a RUNNING room: an INTENTIONAL leave is immediate and is
  // a NO CONTEST. It must not wait out any reconnect grace (that window exists
  // for network drops, not for a player who pressed Leave), and it must not
  // hand the remaining player a win.
  const leaveRunning = makeChallenge({
    code: 'TY-LEAV2',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 5000),
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
  });
  const leftRunning = await leaveChallenge(leaveRunning, 'u1');
  assert.equal(leftRunning.status, 'COMPLETED');
  assert.equal(leftRunning.endedBy, 'opponent_left');
  assert.equal(leftRunning.winner, null, 'leaving mid-race never awards a winner');
  assert.equal(leftRunning.abandonedBy, 'player1');
  assert.equal(leftRunning.player1.connected, false);
  assert.ok(leftRunning.player1.disconnectedAt, 'the leaver is marked offline for presence');

  // …but a player who already banked their score has FINISHED the race: their
  // intentional exit afterwards must not void it as opponent_left.
  const leaveAfterSubmit = makeChallenge({
    code: 'TY-LEAV2B',
    status: 'RUNNING',
    startAt: new Date(Date.now() - 5000),
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: { typedWords: [], wpm: 42, accuracy: 95, correctWords: 42, attemptedWords: 42, errorsCount: 0, submittedAt: new Date() } },
  });
  leaveAfterSubmit.player1.stats = { typedWords: [], wpm: 40, accuracy: 95, correctWords: 40, attemptedWords: 40, errorsCount: 0, submittedAt: new Date() };
  const leftAfterSubmit = await leaveChallenge(leaveAfterSubmit, 'u1');
  assert.equal(leftAfterSubmit.status, 'RUNNING', 'a post-submission exit does not end the race');
  assert.equal(leftAfterSubmit.endedBy, null);
  assert.equal(leftAfterSubmit.player1.connected, false);

  // leaveChallenge on a COMPLETED room: an explicit leave is PERMANENT — the
  // player is marked disconnected and their reconnection clock is backdated
  // past the grace window so the opponent's presence reads "left" immediately
  // (a pending rematch can never wait on a ghost), and their own rematch
  // request is dropped.
  const leaveDone = makeChallenge({
    code: 'TY-LEAV3',
    status: 'COMPLETED',
    round: 2,
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: true, disconnectedAt: null, stats: { typedWords: [], wpm: 40, accuracy: 100, correctWords: 40, attemptedWords: 40, errorsCount: 0, submittedAt: new Date() } },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, disconnectedAt: null, stats: { typedWords: [], wpm: 35, accuracy: 100, correctWords: 35, attemptedWords: 35, errorsCount: 0, submittedAt: new Date() } },
  });
  const leftDone = await leaveChallenge(leaveDone, 'u1');
  assert.equal(leftDone.status, 'COMPLETED');
  assert.equal(leftDone.player1.connected, false, 'leaving a finished room disconnects the leaver');
  assert.equal(leftDone.player1.rematchReady, false, 'the leaver cannot keep a pending rematch');
  assert.equal(playerPresence(leftDone.player1, Date.now()), 'left', 'leave backdates past grace → presence "left" on the next read');
  assert.equal(playerIsGone(leftDone.player1, Date.now()), true, 'an explicit leaver is permanently gone');

  // playerPresence / playerIsGone — online vs offline-within-grace vs left.
  assert.equal(playerPresence({ connected: true, disconnectedAt: null } as any, Date.now()), 'online');
  assert.equal(playerPresence({ connected: false, disconnectedAt: new Date(Date.now() - 5000) } as any, Date.now()), 'offline', 'drop within the grace window is only offline, never gone');
  assert.equal(playerPresence({ connected: false, disconnectedAt: new Date(Date.now() - DISCONNECT_GRACE_MS - 1000) } as any, Date.now()), 'left', 'drop past the grace window is permanently left');
  assert.equal(playerPresence({ connected: false, disconnectedAt: null } as any, Date.now()), 'left', 'disconnected with no recorded drop is treated as gone');
  assert.equal(playerIsGone({ connected: true, disconnectedAt: null } as any, Date.now()), false);
  assert.equal(playerIsGone({ connected: false, disconnectedAt: new Date(Date.now() - 5000) } as any, Date.now()), false, 'still inside grace → not gone');
  assert.equal(playerIsGone({ connected: false, disconnectedAt: new Date(Date.now() - DISCONNECT_GRACE_MS - 1000) } as any, Date.now()), true, 'past grace → gone');

  // requestRematch — opponent permanently gone BEFORE/DURING the ask: the
  // caller's flag is cancelled and opponentGone is surfaced, so the client can
  // show the gone-opponent state instead of "waiting…" forever.
  const ghostRoom = makeChallenge({
    code: 'TY-GHOST',
    status: 'COMPLETED',
    round: 1,
    winner: 'player1',
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, disconnectedAt: null, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: false, joinedAt: new Date(), rematchReady: false, disconnectedAt: new Date(Date.now() - DISCONNECT_GRACE_MS - 1000), stats: null },
  });
  const ghostAsk = await requestRematch(ghostRoom, alice);
  assert.equal(ghostAsk.opponentGone, true, 'opponent past grace → ask is answered as gone');
  assert.equal(ghostAsk.challenge.player1.rematchReady, false, 'the request is cancelled, never left waiting');
  assert.equal(ghostAsk.challenge.player2?.rematchReady, false);

  // resolvePendingRematch — while both players are up (or within grace) the
  // pending rematch is NOT cancelled, and once either player is permanently
  // gone it IS cancelled (both flags reset) so the sweeper can tell the
  // waiting player instead of leaving them stranded.
  const pendingLively = makeChallenge({
    code: 'TY-PEN1',
    status: 'COMPLETED',
    round: 1,
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: true, disconnectedAt: null, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: false, joinedAt: new Date(), rematchReady: false, disconnectedAt: new Date(Date.now() - 5000), stats: null },
  });
  const lively = await resolvePendingRematch(pendingLively, Date.now());
  assert.equal(lively.cancelled, false, 'opponent still inside the grace window → rematch stays alive');
  assert.equal(pendingLively.player1.rematchReady, true);
  const pendingGhost = makeChallenge({
    code: 'TY-PEN2',
    status: 'COMPLETED',
    round: 1,
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: true, disconnectedAt: null, stats: null },
    player2: { userId: 'u2', username: 'bob', ready: false, connected: false, joinedAt: new Date(), rematchReady: false, disconnectedAt: new Date(Date.now() - DISCONNECT_GRACE_MS - 1000), stats: null },
  });
  const ghosty = await resolvePendingRematch(pendingGhost, Date.now());
  assert.equal(ghosty.cancelled, true, 'opponent past grace → pending rematch is cancelled');
  assert.equal(pendingGhost.player1.rematchReady, false, 'requesting player is released');
  assert.equal(pendingGhost.player2?.rematchReady, false);
  const noAsk = makeChallenge({ code: 'TY-PEN3', status: 'COMPLETED', round: 1 });
  assert.equal((await resolvePendingRematch(noAsk, Date.now())).cancelled, false, 'no pending request → nothing to cancel');

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
    // Deliberately dirty round-1 ending: the new round must wipe both of these
    // instead of letting them ride along into a live race.
    endedBy: 'completed',
    abandonedBy: 'player1',
    player1: { userId: 'u1', username: 'alice', ready: false, connected: true, joinedAt: new Date(), rematchReady: false, stats: { typedWords: [], wpm: 44, accuracy: 100, correctWords: 44, attemptedWords: 44, errorsCount: 0, submittedAt: new Date() } },
    player2: { userId: 'u2', username: 'bob', ready: true, connected: true, joinedAt: new Date(), rematchReady: false, stats: { typedWords: [], wpm: 33, accuracy: 100, correctWords: 33, attemptedWords: 33, errorsCount: 0, submittedAt: new Date() } },
  });

  // One player requesting alone must NOT start a new round.
  const firstAsk = await requestRematch(completed, alice);
  const flagged = firstAsk.challenge;
  assert.equal(firstAsk.opponentGone, false, 'opponent is online → no gone flag');
  assert.equal(flagged.status, 'COMPLETED');
  assert.equal(flagged.player1.rematchReady, true);
  assert.equal(flagged.player2?.rematchReady, false);
  assert.equal(flagged.round, 1);
  assert.equal(await startRematchIfBothReady('TY-REMA2', { content: 'fresh round text two', paragraphIds: ['p2'] } as any), null, 'round must not start until BOTH players ask');

  // Second player requests → both flags set → EXACTLY ONE next round, started
  // immediately (no ready-up lobby) with a short shared countdown.
  const secondAsk = await requestRematch(completed, bob);
  assert.equal(secondAsk.opponentGone, false);
  const beforeAdvance = Date.now();
  const advanced = await startRematchIfBothReady('TY-REMA2', { content: 'fresh round text two', paragraphIds: ['p2'] } as any);
  assert.ok(advanced, 'both rematch flags set → next round must start');
  assert.equal(advanced.round, 2);
  assert.equal(advanced.status, 'RUNNING', 'a rematch must start the race immediately, not back in the lobby');
  assert.equal(advanced.winner, null);
  assert.ok(advanced.startAt instanceof Date && advanced.startAt.getTime() >= beforeAdvance, 'rematch must schedule a start time in the future');
  assert.ok(advanced.startAt.getTime() <= Date.now() + REMATCH_START_DELAY_MS, 'rematch start must be within the shared countdown lead');
  assert.equal(advanced.text, 'fresh round text two');
  assert.ok(advanced.paragraphIds.some((id) => String(id) === 'p2'), `rematch round records the used paragraph (got ${JSON.stringify(advanced.paragraphIds)})`);
  assert.equal(advanced.player1.rematchReady, false);
  assert.equal(advanced.player2?.rematchReady, false);
  assert.equal(advanced.player1.stats, null);
  assert.equal(advanced.player2?.stats, null);
  assert.equal(advanced.player1.ready, false);
  assert.equal(advanced.player2?.ready, false);
  // A live round must not inherit the PREVIOUS round's ending. A client that
  // reads `endedBy` while status is RUNNING would otherwise treat the fresh
  // race as already over (or as a forfeit by the wrong slot).
  assert.equal(advanced.endedBy, null, 'a new round must not carry the previous round\'s endedBy');
  assert.equal(advanced.abandonedBy, null, 'a new round must not carry the previous round\'s abandonedBy');

  // Race-safety: a second (concurrent) advance call gets null — no duplicate
  // round, no duplicate text, no round-3 impostor.
  const secondAdvance = await startRematchIfBothReady('TY-REMA2', { content: 'a different paragraph', paragraphIds: ['p3'] } as any);
  assert.equal(secondAdvance, null, 'second concurrent advance must not create another round');
  assert.equal(advanced.round, 2, 'round must stay 2 after the losing concurrent call');

  // The started rematch round is already live: it must not be startable (or
  // ready-able) again, and the ordinary start path must refuse to touch it.
  await assertRejects(
    markReady(advanced, alice),
    'This challenge has expired.',
    400
  );
  assert.equal(await startChallengeIfReady('TY-REMA2'), null, 'an already-running rematch must not be restarted by the ready path');

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
    player2: { userId: 'u2', username: 'bob', ready: false, connected: false, joinedAt: new Date(), rematchReady: true, disconnectedAt: new Date(Date.now() - DISCONNECT_GRACE_MS - 2000), stats: null },
  }), 'u2');
  assert.equal(pubDone.me, 'player2');
  assert.equal(pubDone.winner, 'player1');
  assert.equal(pubDone.round, 3);
  assert.equal(pubDone.players[0].stats?.wpm, 44);
  assert.equal(pubDone.players[1].rematchReady, true);
  assert.equal(pubDone.players[0].presence, 'online', 'connected player is exposed as online');
  assert.equal(pubDone.players[1].presence, 'left', 'dropped-past-grace player is exposed as left');
  assert.equal(pubDone.startAt, null);
})().then(
  () => console.log('challenge.service tests passed'),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);

// ═══════════════════════ in-duel chat (challengeChat.service) ═══════════════════════
(() => {
  const msgStore: Array<Record<string, unknown>> = [];
  let msgSeq = 0;

  // Valid 24-char hex ids — createChallengeChatMessage wraps senders in ObjectId.
  const CHAT_U1 = 'aaaaaaaaaaaaaaaaaaaaaa01';
  const CHAT_U2 = 'aaaaaaaaaaaaaaaaaaaaaa02';
  const CHAT_U9 = 'aaaaaaaaaaaaaaaaaaaaaa09';

  (ChallengeMessage as any).create = async (data: Record<string, unknown>) => {
    const doc = {
      _id: `m${++msgSeq}`,
      challengeId: data.challengeId,
      round: data.round,
      senderId: data.senderId,
      type: data.type,
      message: data.message,
      createdAt: new Date(Date.now() + msgSeq),
    };
    msgStore.push(doc);
    return doc;
  };
  (ChallengeMessage as any).find = (query: Record<string, unknown> = {}) => {
    const docs = msgStore
      .filter((d) => {
        if (query.challengeId && String(d.challengeId) !== String(query.challengeId)) return false;
        if (query.round !== undefined && d.round !== query.round) return false;
        return true;
      })
      .sort((a, b) => {
        const ta = (a as { createdAt: Date }).createdAt.getTime();
        const tb = (b as { createdAt: Date }).createdAt.getTime();
        return ta - tb;
      });
    return {
      sort: () => ({
        limit: () => ({
          lean: async () => docs,
        }),
      }),
    };
  };

  function assertChatThrows(fn: () => unknown, message: string, statusCode?: number): void {
    try {
      fn();
      assert.fail(`expected rejection: ${message}`);
    } catch (err) {
      assert.ok(err instanceof ChallengeChatError, `expected ChallengeChatError, got ${err}`);
      assert.equal((err as ChallengeChatError).message, message);
      if (statusCode !== undefined) assert.equal((err as ChallengeChatError).statusCode, statusCode);
    }
  }

  async function assertChatRejects(promise: Promise<unknown>, message: string, statusCode?: number): Promise<void> {
    try {
      await promise;
      assert.fail(`expected rejection: ${message}`);
    } catch (err) {
      assert.ok(err instanceof ChallengeChatError, `expected ChallengeChatError, got ${err}`);
      assert.equal((err as ChallengeChatError).message, message);
      if (statusCode !== undefined) assert.equal((err as ChallengeChatError).statusCode, statusCode);
    }
  }

  // sanitizeChatContent
  assert.equal(sanitizeChatContent('text', '  hello   world  '), 'hello world');
  assert.equal(sanitizeChatContent('text', 'x'.repeat(CHAT_MAX_LENGTH)), 'x'.repeat(CHAT_MAX_LENGTH));
  assertChatThrows(() => sanitizeChatContent('text', ''), 'Message cannot be empty.');
  assertChatThrows(() => sanitizeChatContent('text', 'y'.repeat(CHAT_MAX_LENGTH + 1)), `Message is too long (max ${CHAT_MAX_LENGTH} characters).`);
  assert.equal(sanitizeChatContent('reaction', ' 🔥 '), '🔥');
  assert.ok(CHAT_REACTIONS.includes(sanitizeChatContent('reaction', '🔥')));
  assertChatThrows(() => sanitizeChatContent('reaction', '🦄'), 'Unknown reaction.');
  assert.equal(sanitizeChatContent('sticker', ' FAST '), 'fast');
  assert.ok(CHAT_STICKERS.some((s) => s.id === 'gg'), 'sticker catalog ships the GG card');
  assert.ok(CHAT_STICKERS.length >= 10, 'sticker catalog has the full roster');
  assertChatThrows(() => sanitizeChatContent('sticker', 'nope'), 'Unknown sticker.');

  // Sanitization never trusts the message type either.
  assertChatThrows(() => sanitizeChatContent('meme', 'hi'), 'Invalid message type.');

  const chatRoom = makeChallenge({
    code: 'TY-CHAT1',
    status: 'RUNNING',
    round: 2,
    player1: { userId: CHAT_U1, username: 'alice', ready: true, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
    player2: { userId: CHAT_U2, username: 'bob', ready: true, connected: true, joinedAt: new Date(), rematchReady: false, stats: null },
  });

  // Non-participants cannot send.
  assertChatRejects(
    createChallengeChatMessage(chatRoom, CHAT_U9, 'text', 'hi'),
    'You are not part of this challenge.',
    403
  );

  // An expired challenge closes the chat.
  const expiredRoom = makeChallenge({ code: 'TY-CHATX', status: 'EXPIRED', round: 1 });
  assertChatRejects(
    createChallengeChatMessage(expiredRoom, CHAT_U1, 'text', 'hi'),
    'This challenge has expired. Chat is closed.',
    400
  );

  (async () => {
    // Round is stamped from the challenge, never from the client.
    const a = await createChallengeChatMessage(chatRoom, CHAT_U1, 'text', 'hello   there');
    assert.equal(a.message, 'hello there');
    assert.equal(a.round, 2);
    assert.equal(a.senderId, CHAT_U1);
    assert.equal(a.type, 'text');

    const b = await createChallengeChatMessage(chatRoom, CHAT_U2, 'text', 'catching up!');
    assert.equal(b.senderId, CHAT_U2);

    const reaction = await createChallengeChatMessage(chatRoom, CHAT_U2, 'reaction', '🔥');
    assert.equal(reaction.type, 'reaction');
    assert.equal(reaction.message, '🔥');

    const sticker = await createChallengeChatMessage(chatRoom, CHAT_U1, 'sticker', 'gg');
    assert.equal(sticker.type, 'sticker');
    assert.equal(sticker.message, 'gg');

    const history = await listChallengeChatMessages(chatRoom._id, 2);
    assert.equal(history.length, 4, 'history holds every message for the round');
    assert.deepEqual(
      history.map((m) => m.senderId),
      [CHAT_U1, CHAT_U2, CHAT_U2, CHAT_U1],
      'history is in ascending chronological order'
    );
    assert.ok(history.every((m) => m.round === 2), 'history never leaks messages from other rounds');

    // A REJECTED message must not appear in history (participant guard above) —
    // only the four accepted messages are persisted.
    const afterReject = await listChallengeChatMessages(chatRoom._id, 2);
    assert.equal(afterReject.length, 4, 'rejected sends do not persist');
  })().then(
    () => console.log('challengeChat.service tests passed'),
    (err) => {
      console.error(err);
      process.exit(1);
    }
  );
})();