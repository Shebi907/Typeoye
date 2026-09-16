import { Response } from 'express';
import { sendError } from '../utils/response';

/** Max consecutive wrong security-question answers before recovery locks. */
export const MAX_WRONG_SECURITY_ANSWERS = 5;

/** How long recovery is locked after 5 consecutive wrong answers. */
export const RECOVERY_LOCKOUT_MS = 30 * 60 * 1000;

/** Client-facing message for a locked recovery flow. */
export const RECOVERY_LOCKED_MESSAGE =
  'Password recovery is temporarily locked. Please try again in 30 minutes.';

/** Returns true while the account's recovery flow is locked (including
 *  right at the expiry boundary — the lock only lifts past the timestamp). */
export function isRecoveryLocked(lockedUntil: Date | null | undefined, now: Date): boolean {
  return !!lockedUntil && lockedUntil.getTime() > now.getTime();
}

/** Lock is set but has already passed — next attempt restarts the counter. */
export function isRecoveryLockExpired(lockedUntil: Date | null | undefined, now: Date): boolean {
  return !!lockedUntil && lockedUntil.getTime() <= now.getTime();
}

/** Whole seconds remaining until the lock lifts (always >= 1 while locked). */
export function lockRemainingSeconds(lockedUntil: Date | null | undefined, now: Date): number {
  if (!lockedUntil || lockedUntil.getTime() <= now.getTime()) return 0;
  return Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000));
}

/** The persisted state after a correct security-question answer — the
 *  consecutive-failure counter is reset and any lock is cleared. */
export function recoverySuccessState() {
  return { recoveryFailedAttempts: 0, recoveryLockedUntil: null };
}

/** Send the "recovery is locked" error with machine-readable retry info so the
 *  client can render an accurate countdown. */
export function lockedResponse(res: Response, lockedUntil: Date): void {
  sendError(res, RECOVERY_LOCKED_MESSAGE, 429, {
    passwordRecoveryLocked: true,
    retryAfterSeconds: lockRemainingSeconds(lockedUntil, new Date()),
    lockedUntil: lockedUntil.toISOString(),
  });
}

/** Atomic MongoDB aggregation pipeline for a failed security-question answer.
 *
 *  Run inside a single findOneAndUpdate so MongoDB serializes the increment and
 *  lock decision — concurrent requests can each add exactly one failure and the
 *  5th one to apply wins the lock (no read-modify-write race that could bypass
 *  the limit).
 *
 *  It also self-heals an expired lock: if a previous lock timestamp is in the
 *  past, the consecutive-failure counter restarts at 1 instead of stacking. */
export function buildFailedAnswerPipeline(now: Date): Array<Record<string, unknown>> {
  return [
    {
      $set: {
        recoveryFailedAttempts: {
          $cond: [
            { $and: [{ $ne: ['$recoveryLockedUntil', null] }, { $lt: ['$recoveryLockedUntil', now] }] },
            1,
            { $add: [{ $ifNull: ['$recoveryFailedAttempts', 0] }, 1] },
          ],
        },
      },
    },
    {
      $set: {
        recoveryLockedUntil: {
          $cond: [
            { $gte: ['$recoveryFailedAttempts', MAX_WRONG_SECURITY_ANSWERS] },
            new Date(now.getTime() + RECOVERY_LOCKOUT_MS),
            null,
          ],
        },
      },
    },
  ];
}