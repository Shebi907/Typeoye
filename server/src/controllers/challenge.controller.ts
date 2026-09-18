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
  pickFreshText,
  leaveChallenge,
  toPublic,
  startAtMs,
  CHALLENGE_DEFAULT_DURATION,
  ChallengeError,
} from '../services/challenge.service';
import { emitToChallenge } from '../services/challenge.socket';
import { sendSuccess, sendError } from '../utils/response';

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
    sendSuccess(res, { challenge: toPublic(challenge, user._id.toString()) });
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
    const challenge = await loadChallengeOrThrow(code);
    await markReady(challenge, user);

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
    //    mutates the race itself).
    const requested = await requestRematch(challenge, user);

    // 2) If BOTH players have now asked, atomically create exactly ONE next
    //    round. Two simultaneous clicks both run this, but only one wins the
    //    findOneAndUpdate (status leaves COMPLETED), so a duplicate round is
    //    impossible. The fresh text is chosen before the write from the
    //    CURRENT round's text, guaranteeing every round gets new content.
    const freshText = await pickFreshText(challenge);
    const advanced = await startRematchIfBothReady(code, freshText);

    // Always broadcast the AUTHORITATIVE state — a losing concurrent request
    // must never broadcast its pre-advance snapshot over the fresh round.
    const fresh = advanced ?? (await loadChallengeOrThrow(code));
    const pub = toPublic(fresh, user._id.toString());
    emitToChallenge(fresh.code, 'challenge:state', { challenge: pub });
    if (advanced) {
      emitToChallenge(fresh.code, 'challenge:rematch', { challenge: pub });
    }
    sendSuccess(res, { challenge: pub, advanced: Boolean(advanced) });
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