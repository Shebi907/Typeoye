import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createChallenge,
  loadChallengeOrThrow,
  joinChallenge,
  markReady,
  startChallengeIfReady,
  submitResults,
  requestRematch,
  startRematchIfBothReady,
  resolvePendingRematch,
  pickFreshText,
  leaveChallenge,
  toPublic,
  startAtMs,
  endAtMs,
  finalizeRunningIfDue,
  CHALLENGE_DEFAULT_DURATION,
  CHALLENGE_FINISH_GRACE_MS,
  ChallengeError,
  playerSlotOf,
} from '../services/challenge.service';
import {
  listChallengeChatMessages,
  ChallengeChatError,
} from '../services/challengeChat.service';
import { emitToChallenge } from '../services/challenge.socket';
import { sendSuccess, sendError } from '../utils/response';

// One-shot re-check queue: after any submission that does not yet finish the
// race, we schedule a precise finalization at the authoritative end time (+
// finish grace) instead of waiting on the sweeper's 10-second cadence. Keyed
// by code+round so concurrent submissions never stack duplicate timers, and a
// scheduled run that still finds the race waiting on a slow opponent re-schedules
// itself for endAt + CHALLENGE_FINISH_GRACE_MS.
const pendingFinalize = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleFinalizeCheck(code: string, round: number, waitMs: number): void {
  const key = `${code}:${round}`;
  if (pendingFinalize.has(key)) return;
  const timer = setTimeout(() => {
    pendingFinalize.delete(key);
    void (async () => {
      try {
        const fresh = await loadChallengeOrThrow(code);
        if (fresh.status !== 'RUNNING' || fresh.round !== round) return;
        const endAt = endAtMs(fresh);
        const result = await finalizeRunningIfDue(fresh, Date.now());
        const next = result.challenge;
        if (next.status === 'COMPLETED') {
          emitToChallenge(code, 'challenge:results', { challenge: toPublic(next) });
        } else if (next.status === 'EXPIRED') {
          emitToChallenge(code, 'challenge:state', { challenge: toPublic(next) });
        } else if (next.status === 'RUNNING') {
          scheduleFinalizeCheck(code, round, Math.max(50, endAt + CHALLENGE_FINISH_GRACE_MS + 150 - Date.now()));
        }
      } catch {
        // ignore: the sweeper remains the safety net
      }
    })();
  }, waitMs);
  pendingFinalize.set(key, timer);
}

export const createSchema = z.object({
  durationSeconds: z.number().int().min(30).max(300).optional(),
});

export const resultsSchema = z.object({
  round: z.number().int().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  typedWords: z
    .array(
      z.object({
        word: z.string(),
        typed: z.string(),
        correct: z.boolean(),
        timeTakenMs: z.number().min(0),
      })
    )
    .max(4000),
});

export async function createChallengeHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const body = req.body as z.infer<typeof createSchema>;
    const challenge = await createChallenge(user, body.durationSeconds ?? CHALLENGE_DEFAULT_DURATION);
    sendSuccess(res, { challenge: toPublic(challenge, user._id.toString()) }, 201);
  } catch (err) {
    console.error('createChallenge error:', err);
    if (err instanceof ChallengeError) sendError(res, err.message, err.statusCode);
    else sendError(res, 'Failed to create challenge', 500);
  }
}

export async function getChallengeHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const challenge = await loadChallengeOrThrow(req.params['code'] ?? '');
    // A read must never surface a pending rematch against an opponent that is
    // already permanently gone: resolve (atomic, no-op while both are up or
    // within the reconnect grace) so a refresh/page-load always gets a snapshot
    // whose flags agree with presence — no waiting on the sweeper.
    const resolved = challenge.status === 'COMPLETED'
      ? (await resolvePendingRematch(challenge, Date.now())).challenge
      : challenge;
    sendSuccess(res, { challenge: toPublic(resolved, user._id.toString()) });
  } catch (err) {
    console.error('getChallenge error:', err);
    if (err instanceof ChallengeError) sendError(res, err.message, err.statusCode);
    else sendError(res, 'Failed to load challenge', 500);
  }
}

export async function joinChallengeHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const challenge = await loadChallengeOrThrow(req.params['code'] ?? '');
    const updated = await joinChallenge(challenge, user);
    emitToChallenge(updated.code, 'challenge:state', { challenge: toPublic(updated, user._id.toString()) });
    sendSuccess(res, { challenge: toPublic(updated, user._id.toString()) });
  } catch (err) {
    console.error('joinChallenge error:', err);
    if (err instanceof ChallengeError) sendError(res, err.message, err.statusCode);
    else sendError(res, 'Failed to join challenge', 500);
  }
}

export async function readyHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const code = (req.params['code'] ?? '').trim().toUpperCase();
    // Default to true so an older client that posts no body keeps working;
    // `{ ready: false }` is the explicit "stand back down" call.
    const wantsReady = (req.body as { ready?: unknown } | undefined)?.ready !== false;
    const challenge = await loadChallengeOrThrow(code);
    const { challenge: afterReady } = await markReady(challenge, user, wantsReady);

    if (!wantsReady) {
      const pub = toPublic(afterReady, user._id.toString());
      emitToChallenge(afterReady.code, 'challenge:state', { challenge: pub });
      sendSuccess(res, { challenge: pub, bothReady: false });
      return;
    }

    // startChallengeIfReady is idempotent: only ONE concurrent call can create
    // the startTime (the condition requires startAt === null). If a concurrent
    // request already started it, we simply mirror the existing authoritative state.
    const started = await startChallengeIfReady(code);
    if (started) {
      const pub = toPublic(started, user._id.toString());
      emitToChallenge(code, 'challenge:started', {
        startAtMs: startAtMs(started),
        durationSeconds: started.durationSeconds,
        text: started.text,
        challenge: pub,
      });
      sendSuccess(res, { challenge: pub, bothReady: true });
      return;
    }

    const fresh = await loadChallengeOrThrow(code);
    if (fresh.status === 'RUNNING' && fresh.startAt) {
      sendSuccess(res, { challenge: toPublic(fresh, user._id.toString()), bothReady: true });
      return;
    }
    const pub = toPublic(fresh, user._id.toString());
    emitToChallenge(fresh.code, 'challenge:state', { challenge: pub });
    sendSuccess(res, { challenge: pub, bothReady: false });
  } catch (err) {
    console.error('readyHandler error:', err);
    if (err instanceof ChallengeError) sendError(res, err.message, err.statusCode);
    else sendError(res, 'Failed to mark ready', 500);
  }
}

export async function resultsHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const challenge = await loadChallengeOrThrow(req.params['code'] ?? '');
    const body = req.body as z.infer<typeof resultsSchema>;
    const { challenge: updated, final } = await submitResults(challenge, user, body.typedWords, body.round);
    const pub = toPublic(updated, user._id.toString());
    if (final) {
      emitToChallenge(updated.code, 'challenge:results', { challenge: pub });
    } else if (updated.status === 'RUNNING') {
      // Not final yet: ensure the race still resolves at the authoritative
      // timer even if the opponent never submits (or both clock-skewed early).
      scheduleFinalizeCheck(updated.code, updated.round, Math.max(50, endAtMs(updated) + 300 - Date.now()));
    }
    sendSuccess(res, { challenge: pub, final });
  } catch (err) {
    console.error('resultsHandler error:', err);
    if (err instanceof ChallengeError) sendError(res, err.message, err.statusCode);
    else sendError(res, 'Failed to submit results', 500);
  }
}

export async function rematchHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const code = (req.params['code'] ?? '').trim().toUpperCase();
    const challenge = await loadChallengeOrThrow(code);

    // 1) Stamp this player's "rematch requested" flag (idempotent, never
    //    mutates the race itself). If the OPPONENT is already permanently gone
    //    (left or past the reconnection grace), the request is cancelled and we
    //    answer immediately instead of leaving the player waiting forever.
    const requested = await requestRematch(challenge, user);
    if (requested.opponentGone) {
      const pub = toPublic(requested.challenge, user._id.toString());
      emitToChallenge(requested.challenge.code, 'challenge:opponentLeft', {
        challenge: pub,
        message: 'Your opponent is no longer available.',
      });
      sendSuccess(res, { challenge: pub, advanced: false, opponentGone: true });
      return;
    }

    // 2) If BOTH players have now asked, atomically create exactly ONE next
    //    round. Two simultaneous clicks both run this, but only one wins the
    //    findOneAndUpdate (status leaves COMPLETED), so a duplicate round is
    //    impossible. The fresh text is chosen before the write from the
    //    CURRENT round's text, guaranteeing every round gets new content.
    const freshText = await pickFreshText(requested.challenge);
    const advanced = await startRematchIfBothReady(code, freshText);

    // Always broadcast the AUTHORITATIVE state — a losing concurrent request
    // must never broadcast its pre-advance snapshot over the fresh round.
    const fresh = advanced ?? (await loadChallengeOrThrow(code));
    const pub = toPublic(fresh, user._id.toString());
    emitToChallenge(fresh.code, 'challenge:state', { challenge: pub });
    if (advanced) {
      emitToChallenge(fresh.code, 'challenge:rematch', { challenge: pub });
      // The rematch round is already RUNNING (no ready-up screen), so hand both
      // clients the same start payload readyHandler sends: both drop straight
      // into the shared countdown and then the race, in the same room/socket.
      emitToChallenge(fresh.code, 'challenge:started', {
        startAtMs: startAtMs(fresh),
        durationSeconds: fresh.durationSeconds,
        text: fresh.text,
        challenge: pub,
      });
    }
    sendSuccess(res, { challenge: pub, advanced: Boolean(advanced), opponentGone: false });
  } catch (err) {
    console.error('rematchHandler error:', err);
    if (err instanceof ChallengeError) sendError(res, err.message, err.statusCode);
    else sendError(res, 'Failed to start rematch', 500);
  }
}

export async function leaveHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const challenge = await loadChallengeOrThrow(req.params['code'] ?? '');
    const updated = await leaveChallenge(challenge, user._id.toString());
    emitToChallenge(updated.code, 'challenge:opponentLeft', { challenge: toPublic(updated) });
    sendSuccess(res, { challenge: toPublic(updated, user._id.toString()) });
  } catch (err) {
    console.error('leaveHandler error:', err);
    if (err instanceof ChallengeError) sendError(res, err.message, err.statusCode);
    else sendError(res, 'Failed to leave challenge', 500);
  }
}

export async function getChallengeChatMessagesHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const code = (req.params['code'] ?? '').trim().toUpperCase();
    const challenge = await loadChallengeOrThrow(code);
    if (!playerSlotOf(challenge, user._id.toString())) {
      sendError(res, 'You are not part of this challenge.', 403);
      return;
    }
    const rawRound = Number(req.query['round']);
    const round = Number.isInteger(rawRound) && rawRound >= 1 ? rawRound : challenge.round;
    const messages = await listChallengeChatMessages(challenge._id, round);
    sendSuccess(res, { messages, round });
  } catch (err) {
    console.error('getChallengeChatMessages error:', err);
    if (err instanceof ChallengeError || err instanceof ChallengeChatError) {
      sendError(res, err.message, err.statusCode);
    } else {
      sendError(res, 'Failed to load chat messages', 500);
    }
  }
}