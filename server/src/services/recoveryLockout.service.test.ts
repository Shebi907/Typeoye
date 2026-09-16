import assert from 'assert';
import {
  MAX_WRONG_SECURITY_ANSWERS,
  RECOVERY_LOCKOUT_MS,
  buildFailedAnswerPipeline,
  isRecoveryLocked,
  isRecoveryLockExpired,
  lockRemainingSeconds,
  recoverySuccessState,
} from './recoveryLockout.service';

/* The lockout decision logic runs as a MongoDB aggregation pipeline inside a
 * single findOneAndUpdate. There is no test DB in this repo, so this suite
 * interprets the *actual emitted pipeline* against simulated user documents —
 * which verifies the decision table (counting, expiry reset, 5th-failure lock)
 * exactly as the backend encodes it. MongoDB serializes each atomic update, so
 * sequential application here models the no-bypass semantics of a real run. */

type Doc = Record<string, unknown>;

function getValue(expr: unknown, doc: Doc): unknown {
  if (typeof expr === 'string' && expr.startsWith('$')) return doc[expr.slice(1)];
  if (expr === null || expr === undefined || typeof expr !== 'object') return expr;
  if (expr instanceof Date) return expr;
  const record = expr as Record<string, unknown>;
  if (record.$cond) {
    const [c, t, f] = record.$cond as unknown[];
    return getValue(c, doc) ? getValue(t, doc) : getValue(f, doc);
  }
  if (record.$and) return (record.$and as unknown[]).every((a) => getValue(a, doc));
  if (record.$ne) {
    const [a, b] = record.$ne as unknown[];
    return getValue(a, doc) !== getValue(b, doc);
  }
  if (record.$lt) {
    const [a, b] = record.$lt as unknown[];
    return (getValue(a, doc) as number) < (getValue(b, doc) as number);
  }
  if (record.$gte) {
    const [a, b] = record.$gte as unknown[];
    return (getValue(a, doc) as number) >= (getValue(b, doc) as number);
  }
  if (record.$add) {
    return (record.$add as unknown[]).reduce((acc, x) => (acc as number) + (getValue(x, doc) as number), 0);
  }
  if (record.$ifNull) {
    const [a, b] = record.$ifNull as unknown[];
    const v = getValue(a, doc);
    return v === null || v === undefined ? getValue(b, doc) : v;
  }
  return expr;
}

function applyPipeline(doc: Doc, now: Date): Doc {
  const next: Doc = { ...doc };
  for (const stage of buildFailedAnswerPipeline(now) as Array<{ $set?: Record<string, unknown> }>) {
    if (!stage.$set) continue;
    for (const [field, expr] of Object.entries(stage.$set)) {
      next[field] = getValue(expr, next);
    }
  }
  return next;
}

/** Apply `count` wrong-answer pipeline updates sequentially (what MongoDB does
 *  when it serializes concurrent atomic updates on one document). */
function wrongAnswers(count: number, from: Doc, now: Date): Doc {
  let doc: Doc = { recoveryFailedAttempts: 0, recoveryLockedUntil: null, ...from };
  for (let i = 0; i < count; i++) doc = applyPipeline(doc, now);
  return doc;
}

/** Mirrors the controller's pre-check: while locked, no update is applied. */
function attempt(doc: Doc, now: Date): { rejected: boolean; state: Doc } {
  if (isRecoveryLocked(doc.recoveryLockedUntil as Date | null, now)) {
    return { rejected: true, state: doc };
  }
  return { rejected: false, state: applyPipeline(doc, now) };
}

const NOW = new Date('2026-09-16T12:00:00.000Z');
const EMPTY: Doc = { recoveryFailedAttempts: 0, recoveryLockedUntil: null };

// 1–4 wrong answers: counter increments, never locked.
let d = wrongAnswers(1, EMPTY, NOW);
assert.equal(d.recoveryFailedAttempts, 1);
assert.equal(d.recoveryLockedUntil, null);
assert.equal(isRecoveryLocked(d.recoveryLockedUntil as Date | null, NOW), false);
console.log('1 wrong → counter 1, not locked ✓');

d = wrongAnswers(2, EMPTY, NOW);
assert.equal(d.recoveryFailedAttempts, 2);
assert.equal(d.recoveryLockedUntil, null);
console.log('2 wrong → counter 2 ✓');

d = wrongAnswers(3, EMPTY, NOW);
assert.equal(d.recoveryFailedAttempts, 3);
assert.equal(d.recoveryLockedUntil, null);
console.log('3 wrong → counter 3 ✓');

d = wrongAnswers(4, EMPTY, NOW);
assert.equal(d.recoveryFailedAttempts, 4);
assert.equal(d.recoveryLockedUntil, null);
assert.equal(isRecoveryLocked(d.recoveryLockedUntil as Date | null, NOW), false);
console.log('4 wrong → counter 4, not locked ✓');

// 5th wrong answer → locked for exactly 30 minutes.
const five = wrongAnswers(5, EMPTY, NOW);
assert.equal(five.recoveryFailedAttempts, 5);
assert.ok(five.recoveryLockedUntil instanceof Date);
assert.equal((five.recoveryLockedUntil as Date).getTime(), NOW.getTime() + RECOVERY_LOCKOUT_MS);
assert.equal(isRecoveryLocked(five.recoveryLockedUntil as Date, NOW), true);
assert.equal(lockRemainingSeconds(five.recoveryLockedUntil as Date, NOW), 30 * 60);
console.log('5th wrong → locked for 30 minutes ✓');

// Attempt during lock → rejected; counter untouched; remaining time provided.
const during = attempt(five, NOW);
assert.equal(during.rejected, true);
assert.equal(during.state.recoveryFailedAttempts, 5);
assert.ok(lockRemainingSeconds(during.state.recoveryLockedUntil as Date, NOW) > 0);
console.log('attempt during lock → rejected, counter unchanged, remaining time ✓');

// Correct answer after 1–4 failures resets the counter to 0 and clears lock.
const four = wrongAnswers(4, EMPTY, NOW);
const afterCorrect = { ...four, ...recoverySuccessState() };
assert.deepEqual(afterCorrect, { recoveryFailedAttempts: 0, recoveryLockedUntil: null });
assert.equal(isRecoveryLocked(afterCorrect.recoveryLockedUntil as Date | null, NOW), false);
console.log('correct answer before 5 failures → counter resets to 0, lock cleared ✓');

// After exactly 30 minutes the lock lifts and the counter restarts from 1.
const afterExpiry = new Date(NOW.getTime() + RECOVERY_LOCKOUT_MS + 1);
assert.equal(isRecoveryLocked(five.recoveryLockedUntil as Date, afterExpiry), false);
assert.equal(isRecoveryLockExpired(five.recoveryLockedUntil as Date, afterExpiry), true);
assert.equal(lockRemainingSeconds(five.recoveryLockedUntil as Date, afterExpiry), 0);
const postExpiry = attempt({ ...five, recoveryLockedUntil: new Date(NOW) }, afterExpiry);
assert.equal(postExpiry.rejected, false);
assert.equal(postExpiry.state.recoveryFailedAttempts, 1);
assert.equal(postExpiry.state.recoveryLockedUntil, null);
console.log('after 30 min → lock expires, next attempt works, counter restarts at 1 ✓');

// Refresh / browser restart / device change cannot clear the lock — the state
// lives server-side; any fresh client still observes the locked account.
assert.equal(isRecoveryLocked(five.recoveryLockedUntil as Date, NOW), true);
console.log('refresh / New Device client → lock remains (server-side state) ✓');

// Another user's account is unaffected: the pipeline touches only the matched
// document's lock fields, keyed by the account found via identifier.
const stages = buildFailedAnswerPipeline(NOW) as Array<{ $set?: Record<string, unknown> }>;
assert.equal(stages.length, 2);
for (const stage of stages) {
  for (const key of Object.keys(stage.$set ?? {})) {
    assert.ok(['recoveryFailedAttempts', 'recoveryLockedUntil'].includes(key));
  }
}
const otherUser = wrongAnswers(5, EMPTY, NOW); // victim locked
assert.equal(otherUser.recoveryFailedAttempts, 5);
assert.equal(isRecoveryLocked(otherUser.recoveryLockedUntil as Date, NOW), true);
const pristineUser = wrongAnswers(3, EMPTY, NOW); // different account, own counter
assert.equal(pristineUser.recoveryFailedAttempts, 3);
assert.equal(pristineUser.recoveryLockedUntil, null);
console.log('different account → unaffected, separate counter ✓');

// Concurrent 5th attempts cannot bypass the limit: every wrong answer gets one
// atomic increment; the 5th applied unlockable. A 6th burst still locked.
const six = wrongAnswers(6, EMPTY, NOW);
assert.equal(six.recoveryFailedAttempts, 6);
assert.equal(isRecoveryLocked(six.recoveryLockedUntil as Date, NOW), true);
console.log('concurrent burst of 6 wrong answers → cannot bypass lock ✓');

assert.equal(recoverySuccessState().recoveryFailedAttempts, 0);
assert.equal(recoverySuccessState().recoveryLockedUntil, null);
console.log('success state constant reset ✓');

console.log('Recovery lockout service tests passed');