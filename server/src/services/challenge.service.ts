import { createHash } from 'crypto';
import { Types } from 'mongoose';
import Challenge, {
  IChallenge,
  ChallengeStatus,
  ChallengePlayer,
  ChallengeTypedWord,
  ChallengeEndReason,
} from '../models/Challenge';
import TestParagraph from '../models/TestParagraph';
import { IUser } from '../models/User';

export const CHALLENGE_DEFAULT_DURATION = 60;
export const CHALLENGE_TTL_MS = 30 * 60 * 1000;
// The LOBBY window only - how long an empty room (creator, no opponent yet)
// waits for its first opponent before becoming EXPIRED. This is NOT a typing
// duration: challenges stay 1/2/5 minutes (CHALLENGE_TTL_MS). This is the
// AUTHORITATIVE deadline - it is stamped into `expiresAt` at creation and every
// read/join/sweep compares against it, so the countdown is correct across
// refreshes, background tabs and stale links. `joinChallenge` replaces it with
// the full CHALLENGE_TTL_MS the moment a real opponent sits down, which cancels
// the waiting clock and means the lobby timer can never expire a room that has a
// player in it.
// Ten minutes, not one: the invite is normally a link sent over chat, and
// reading it, opening it and signing in routinely takes longer than a minute.
// A one-minute room expired mid-conversation and, because the client said
// nothing at all when it lapsed, that read as "the challenge is broken" rather
// than "nobody joined in time".
export const CHALLENGE_WAITING_TTL_MS = 10 * 60 * 1000;
export const CHALLENGE_GRACE_MS = 15000;
// After endAt, a connected player who submitted gets CHALLENGE_FINISH_GRACE_MS
// to let their auto-submission land before the opponent is declared the winner
// by abandonment. Both clients fire at their own endAt, so skew + network + a
// throttled background tab fit inside this window; 5s still feels immediate.
export const CHALLENGE_FINISH_GRACE_MS = 5000;
export const DISCONNECT_GRACE_MS = 30 * 1000;
// Reconnection grace for a race that is ALREADY UNDERWAY. Deliberately much
// shorter than the lobby/rematch window above: the race clock is ticking, so
// the remaining player must not sit for half a minute staring at a frozen race.
// 12s absorbs a real network blip (tab throttle, wifi handover, laptop lid) and
// is the deadline after which a mid-race absence counts as an intentional leave.
export const RUNNING_DISCONNECT_GRACE_MS = 12 * 1000;
// Lead time between "both players asked for a rematch" and the rematch race
// going live. A rematch skips the "Ready to Battle?" lobby entirely, so this
// short shared countdown is the only window where both players can get their
// hands on the keyboard before the clock starts. The first race has no lead
// (startChallengeIfReady starts immediately), so this is rematch-only.
export const REMATCH_START_DELAY_MS = 3000;

// Challenge text is scaled to the selected duration so a race can always be
// won (or simply ended by the timer) without running out of content. 6 chars
// per second ≈ a 72 WPM ceiling; players faster than that finish early and
// wait out the clock. Building text from many short, distinct paragraphs also
// guarantees there is no repeated wording inside a single challenge.
export const CHALLENGE_TEXT_CHARS_PER_SECOND = 6;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;

export class ChallengeError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

const STATUS_FLOW: ChallengeStatus[] = ['WAITING', 'PLAYER_JOINED', 'READY', 'RUNNING', 'COMPLETED', 'EXPIRED'];

export function generateCode(): string {
  const bytes = createHash('sha256')
    .update(`${Date.now()}-${Math.random()}-${Math.random().toString(36)}`)
    .digest();
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `TY-${code}`;
}

export async function ensureUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const existing = await Challenge.findOne({ code }).select('_id').lean();
    if (!existing) return code;
  }
  throw new ChallengeError('Could not allocate a challenge code. Please try again.', 500);
}

export function computeStats(typedWords: ChallengeTypedWord[], durationSeconds: number) {
  const attemptedWords = typedWords.length;
  const correctWords = typedWords.filter((word) => word.correct).length;
  const elapsed = Math.max(0.1, durationSeconds);
  return {
    wpm: correctWords === 0 ? 0 : Math.round(correctWords / (elapsed / 60)),
    accuracy: attemptedWords === 0 ? 0 : Math.round((correctWords / attemptedWords) * 1000) / 10,
    correctWords,
    attemptedWords,
    errorsCount: attemptedWords - correctWords,
  };
}

export function isExpired(challenge: IChallenge, now = Date.now()): boolean {
  return challenge.expiresAt.getTime() < now;
}

export async function expireChallenge(challenge: IChallenge): Promise<IChallenge> {
  if (challenge.status !== 'EXPIRED') {
    challenge.set('status', 'EXPIRED');
    challenge.set('winner', null);
    challenge.set('endedBy', 'expired');
    challenge.set('abandonedBy', null);
    await challenge.save();
  }
  return challenge;
}

export async function loadChallengeOrThrow(code: string): Promise<IChallenge> {
  const normalized = code.trim().toUpperCase();
  const challenge = await Challenge.findOne({ code: normalized });
  if (!challenge) throw new ChallengeError('Challenge not found.', 404);
  // The waiting-room TTL is ONLY the "nobody ever joined" deadline. It is
  // stamped at creation and, the moment an opponent sits down, replaced by the
  // full match TTL - so a room that HAS an opponent can never be expired by its
  // old creation deadline, no matter how stale the read is. Expiring such a room
  // here is what used to show a started race the lobby's "no opponent joined in
  // N minutes" card; an opponent leaving is handled as `opponent_left`.
  const soloLobby = challenge.status === 'WAITING' && challenge.player2 === null;
  if (soloLobby && (isExpired(challenge) || challenge.status === 'EXPIRED')) {
    return expireChallenge(challenge);
  }
  return challenge;
}

export function isCodeFormatValid(code: string): boolean {
  return /^TY-[A-Z0-9]{5}$/.test(code.trim().toUpperCase());
}

export function playerSlotOf(challenge: IChallenge, userId: string): 'player1' | 'player2' | null {
  const slotOf = (player: ChallengePlayer | null): boolean =>
    player !== null && player.userId.toString() === userId.toString();
  if (slotOf(challenge.player1)) return 'player1';
  if (slotOf(challenge.player2)) return 'player2';
  return null;
}

export function getOpponentSlot(challenge: IChallenge, slot: 'player1' | 'player2'): 'player1' | 'player2' {
  return slot === 'player1' ? 'player2' : 'player1';
}

function playerOf(challenge: IChallenge, slot: 'player1' | 'player2'): ChallengePlayer {
  return (challenge as any)[slot] as ChallengePlayer;
}

export function isFull(challenge: IChallenge): boolean {
  return challenge.player2 !== null;
}

export function isBetweenStatus(status: ChallengeStatus, ...statuses: ChallengeStatus[]): boolean {
  return statuses.includes(status);
}

export type PlayerPresence = 'online' | 'offline' | 'left';

/**
 * Authoritative presence for a player, derived from the EXISTING realtime
 * connection state (connected + disabledAt against DISCONNECT_GRACE_MS):
 *   - online: connected right now
 *   - offline: dropped but still within the reconnection grace window
 *   - left:  not connected and past the grace window (or never recorded a
 *            disconnect — a legacy room must never wait on a phantom)
 * The rematch flow uses this to distinguish a temporary network drop from a
 * player who has genuinely gone, WITHOUT inventing a separate state system.
 */
export function playerPresence(player: ChallengePlayer | null, now = Date.now()): PlayerPresence {
  if (!player || player.connected) return 'online';
  if (player.disconnectedAt == null || now - player.disconnectedAt.getTime() >= DISCONNECT_GRACE_MS) return 'left';
  return 'offline';
}

/**
 * Has a player permanently gone (as opposed to a transient drop)? Mirrors the
 * grace semantics of `leaverHasGone` but purely on connection state, which is
 * what the REMATCH window cares about: a player who submitted their round but
 * then left is simply gone for rematch purposes.
 */
export function playerIsGone(player: ChallengePlayer | null, now = Date.now()): boolean {
  return playerPresence(player, now) === 'left';
}

export interface PublicChallenge {
  code: string;
  status: ChallengeStatus;
  round: number;
  durationSeconds: number;
  startAt: string | null;
  text: string;
  winner: 'player1' | 'player2' | 'draw' | null;
  endedBy: ChallengeEndReason | null;
  abandonedBy: 'player1' | 'player2' | null;
  players: {
    slot: 'player1' | 'player2';
    userId: string;
    username: string;
    ready: boolean;
    connected: boolean;
    presence: PlayerPresence;
    rematchReady: boolean;
    stats: {
      wpm: number;
      accuracy: number;
      correctWords: number;
      attemptedWords: number;
      errorsCount: number;
    } | null;
  }[];
  me: 'player1' | 'player2' | null;
  createdAt: string;
  expiresAt: string;
}

export function toPublic(challenge: IChallenge, userId?: string): PublicChallenge {
  const showStats = challenge.status === 'COMPLETED';
  const now = Date.now();
  const players: PublicChallenge['players'] = [challenge.player1].map((player) => ({
    slot: 'player1' as const,
    userId: player.userId.toString(),
    username: player.username,
    ready: player.ready,
    connected: player.connected,
    presence: playerPresence(player, now),
    rematchReady: player.rematchReady,
    stats: showStats && player.stats ? {
      wpm: player.stats.wpm,
      accuracy: player.stats.accuracy,
      correctWords: player.stats.correctWords,
      attemptedWords: player.stats.attemptedWords,
      errorsCount: player.stats.errorsCount,
    } : null,
  }));
  if (challenge.player2) {
    players.push({
      slot: 'player2' as const,
      userId: challenge.player2.userId.toString(),
      username: challenge.player2.username,
      ready: challenge.player2.ready,
      connected: challenge.player2.connected,
      presence: playerPresence(challenge.player2, now),
      rematchReady: challenge.player2.rematchReady,
      stats: showStats && challenge.player2.stats ? {
        wpm: challenge.player2.stats.wpm,
        accuracy: challenge.player2.stats.accuracy,
        correctWords: challenge.player2.stats.correctWords,
        attemptedWords: challenge.player2.stats.attemptedWords,
        errorsCount: challenge.player2.stats.errorsCount,
      } : null,
    });
  }
  return {
    code: challenge.code,
    status: challenge.status,
    round: challenge.round,
    durationSeconds: challenge.durationSeconds,
    startAt: challenge.startAt ? challenge.startAt.toISOString() : null,
    text: challenge.text,
    winner: challenge.winner,
    endedBy: challenge.endedBy,
    abandonedBy: challenge.abandonedBy,
    players,
    me: userId ? playerSlotOf(challenge, userId) : null,
    createdAt: challenge.createdAt.toISOString(),
    expiresAt: challenge.expiresAt.toISOString(),
  };
}

/**
 * All paragraph ids a challenge has already used, across every round so far.
 * Used to build the next round's text WITHOUT repeating any paragraph seen in
 * this challenge. Falls back to the pre-`paragraphIds` single field so legacy
 * rows never repeat their own text on the first rematch.
 */
export function usedParagraphIds(challenge: IChallenge): Types.ObjectId[] {
  const ids = challenge.paragraphIds ?? [];
  if (ids.length > 0) return ids;
  const legacy = (challenge as IChallenge & { paragraphId?: Types.ObjectId }).paragraphId;
  if (legacy) return [legacy];
  return [];
}

interface SelectedText {
  content: string;
  paragraphIds: Types.ObjectId[];
}

function joinParagraphContent(paragraphs: Array<{ content: string; _id: Types.ObjectId }>): string {
  return paragraphs
    .map((paragraph) => paragraph.content.trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Sample enough DISTINCT paragraphs (excluding any that were already used in
 * this challenge) to reach the duration-scaled character target. Sampling in
 * excess of the target keeps the final text assembly organic: paragraph
 * boundaries are kept intact, and the race is never limited by where text ran
 * out. If the pool cannot supply fresh paragraphs, we fall back to sampling
 * everything so a marathon rematch still gets text (repeats only become
 * possible after the pool is fully exhausted).
 */
export async function sampleParagraphs(durationSeconds: number, excludeIds: Types.ObjectId[] = []): Promise<Array<{ content: string; _id: Types.ObjectId }>> {
  const targetChars = Math.max(40, durationSeconds * CHALLENGE_TEXT_CHARS_PER_SECOND);
  const maxParagraphs = Math.ceil(targetChars / 40) + 4;
  const pipeline: Record<string, unknown>[] = [];
  if (excludeIds.length > 0) {
    pipeline.push({ $match: { _id: { $nin: excludeIds } } });
  }
  pipeline.push({ $sample: { size: maxParagraphs } });
  let sampled = await TestParagraph.aggregate<{ content: string; _id: Types.ObjectId }>(pipeline as any);
  if (!sampled || sampled.length === 0) {
    sampled = await TestParagraph.aggregate<{ content: string; _id: Types.ObjectId }>([{ $sample: { size: maxParagraphs } }]);
  }
  if (!sampled || sampled.length === 0) {
    throw new ChallengeError('No test paragraphs are available. Run the database seed first.', 500);
  }
  return sampled;
}

/**
 * Build a challenge's typing text for a given duration, assembled from unique
 * paragraphs. Repeats within a single race are impossible: `excludeIds`
 * rejects everything this challenge already used, and the sampled paragraphs
 * are distinct documents.
 *
 * Content is kept SHORT (potentially shorter than the character target) when
 * the pool is tiny — the race is time-based, so running out of text is handled
 * gracefully by the clients instead of looping content.
 */
export async function buildChallengeText(durationSeconds: number, excludeIds: Types.ObjectId[] = []): Promise<SelectedText> {
  const targetChars = Math.max(40, durationSeconds * CHALLENGE_TEXT_CHARS_PER_SECOND);
  const sampled = await sampleParagraphs(durationSeconds, excludeIds);
  const text: typeof sampled = [];
  let chars = 0;
  for (const paragraph of sampled) {
    text.push(paragraph);
    chars += paragraph.content.trim().length;
    if (chars >= targetChars) break;
  }
  return { content: joinParagraphContent(text), paragraphIds: text.map((paragraph) => paragraph._id) };
}

export async function createChallenge(user: IUser, durationSeconds = CHALLENGE_DEFAULT_DURATION): Promise<IChallenge> {
  const duration = Math.min(300, Math.max(30, Math.round(durationSeconds) || CHALLENGE_DEFAULT_DURATION));
  const [code, paragraph] = await Promise.all([
    ensureUniqueCode(),
    buildChallengeText(duration, []),
  ]);
  const now = Date.now();
  const challenge = await Challenge.create({
    code,
    status: 'WAITING',
    round: 1,
    player1: {
      userId: user._id,
      username: user.username,
      ready: false,
      connected: true,
      joinedAt: new Date(now),
      stats: null,
    },
    player2: null,
    text: paragraph.content,
    paragraphIds: paragraph.paragraphIds,
    durationSeconds: duration,
    startAt: null,
    winner: null,
    endedBy: null,
    abandonedBy: null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    expiresAt: new Date(now + CHALLENGE_WAITING_TTL_MS),
  });
  return challenge;
}

export async function joinChallenge(challenge: IChallenge, user: IUser): Promise<IChallenge> {
  const slot = playerSlotOf(challenge, user._id.toString());
  if (slot) {
    // Re-entering a room we already hold a seat in is a legitimate no-op: a
    // refresh, a background tab, or a stale link, all of which must keep
    // presence and readiness intact. That is only true once the opponent has
    // actually taken the other seat.
    //
    // While player2 is still EMPTY this account can never start the room, so
    // silently returning an unstartable challenge strands the caller in a
    // lobby that waits forever for an opponent who is already sitting in this
    // very seat. Refuse loudly and let the caller say so instead.
    if (slot === 'player1' && challenge.player2 === null) {
      throw new ChallengeError(
        'This challenge is waiting for a different player. You cannot play against yourself.',
        400,
      );
    }
    return challenge;
  }

  if (isFull(challenge)) throw new ChallengeError('This challenge is already full.', 400);
  if (isExpired(challenge)) throw new ChallengeError('This challenge has expired.', 400);

  challenge.set('player2', {
    userId: user._id,
    username: user.username,
    ready: false,
    connected: true,
    joinedAt: new Date(),
    rematchReady: false,
    disconnectedAt: null,
    stats: null,
  });
  challenge.set('status', 'PLAYER_JOINED');
  // Once both players are in the room the solo waiting clock no longer
  // applies: give the actual match a full half hour to start.
  challenge.set('expiresAt', new Date(Date.now() + CHALLENGE_TTL_MS));
  return challenge.save();
}

export async function markReady(challenge: IChallenge, user: IUser, ready = true): Promise<{ challenge: IChallenge; bothReady: boolean }> {
  if (isExpired(challenge) || challenge.status === 'EXPIRED') {
    throw new ChallengeError('This challenge has expired.', 400);
  }
  const slot = playerSlotOf(challenge, user._id.toString());
  if (!slot) throw new ChallengeError('You are not part of this challenge.', 403);

  const now = new Date();

  // Standing back down. `ready` used to be write-only, which made the lobby a
  // one-way door: the moment a player pressed "I'm Ready" the button disabled
  // and the only way out was to leave, even though the opponent they were
  // waiting on might never arrive. Clearing the flag also drops the room out
  // of READY so the start can be re-armed from scratch.
  if (!ready) {
    const cleared = await Challenge.findOneAndUpdate(
      {
        _id: challenge._id,
        [`${slot}.userId`]: user._id,
        startAt: null,
        status: { $in: ['WAITING', 'PLAYER_JOINED', 'READY'] },
      },
      {
        $set: { [`${slot}.ready`]: false, status: challenge.player2 ? 'PLAYER_JOINED' : 'WAITING' },
        $unset: { [`${slot}.readyAt`]: '' },
      },
      { new: true },
    );
    return { challenge: cleared ?? challenge, bothReady: false };
  }

  // Atomic per-slot update: set ONLY this player's ready flag so two players
  // clicking "I'm Ready" at the same time can never overwrite each other.
  const updated = await Challenge.findOneAndUpdate(
    {
      _id: challenge._id,
      [`${slot}.userId`]: user._id,
      status: { $in: ['WAITING', 'PLAYER_JOINED', 'READY'] },
      expiresAt: { $gt: now },
    },
    { $set: { [`${slot}.ready`]: true, [`${slot}.readyAt`]: now, [`${slot}.connected`]: true } },
    { new: true }
  );
  if (!updated) throw new ChallengeError('This challenge has expired.', 400);

  const bothReady = !!updated.player2 && updated.player1.ready && updated.player2.ready;

  // Lift the whole room into the shared READY state once BOTH players are
  // ready. Idempotent, atomically guarded: the opponent's flag update and this
  // status flip can never clobber each other. Broadcast rooms then agree on
  // exactly one authoritative READY moment before the start.
  let result = updated;
  if (bothReady && result.status !== 'READY') {
    result = await Challenge.findOneAndUpdate(
      {
        _id: challenge._id,
        'player1.ready': true,
        'player2.ready': true,
        startAt: null,
        status: { $in: ['WAITING', 'PLAYER_JOINED', 'READY'] },
        expiresAt: { $gt: now },
      },
      { $set: { status: 'READY' } },
      { new: true }
    ) ?? updated;
  }

  return { challenge: result, bothReady };
}

/**
 * Atomically transition the challenge to RUNNING and create the ONE official
 * startTime — but ONLY if both players are ready and no startTime exists yet.
 *
 * Because the condition includes `startAt: null`, exactly one concurrent call
 * can ever succeed; every other simultaneous call gets back null. This
 * guarantees a single authoritative start time and prevents double timers.
 */
export async function startChallengeIfReady(code: string): Promise<IChallenge | null> {
  const now = new Date();
  return Challenge.findOneAndUpdate(
    {
      code: code.trim().toUpperCase(),
      status: { $in: ['PLAYER_JOINED', 'READY'] },
      startAt: null,
      'player1.ready': true,
      'player2.ready': true,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        status: 'RUNNING',
        startAt: now,
        winner: null,
        'player1.ready': false,
        'player1.readyAt': null,
        'player2.ready': false,
        'player2.readyAt': null,
      },
    },
    { new: true }
  );
}

export async function markConnected(challenge: IChallenge, userId: string): Promise<IChallenge> {
  const slot = playerSlotOf(challenge, userId);
  if (!slot) return challenge;
  const updated = await Challenge.findOneAndUpdate(
    { _id: challenge._id, [`${slot}.userId`]: userId },
    { $set: { [`${slot}.connected`]: true, [`${slot}.disconnectedAt`]: null } },
    { new: true }
  );
  return updated ?? challenge;
}

export async function markDisconnected(challenge: IChallenge, userId: string): Promise<IChallenge> {
  const slot = playerSlotOf(challenge, userId);
  if (!slot) return challenge;
  // Reconnection clock with "$min" semantics done safely: a repeat drop while
  // already down must NOT extend the grace deadline, but a $min alone can never
  // promote a null/missing field (MongoDB sorts null below every Date, so the
  // first disconnectedAt would stay null and the player would read as
  // permanently "left" on their very first drop). Since the caller always
  // hands us a freshly loaded document, we set connected=false directly and
  // only stamp the clock when it is still empty.
  const player = playerOf(challenge, slot);
  player.connected = false;
  if (!player.disconnectedAt) player.disconnectedAt = new Date();
  challenge.markModified(slot);
  return challenge.save();
}

export function startAtMs(challenge: IChallenge): number {
  return challenge.startAt ? challenge.startAt.getTime() : 0;
}

export function endAtMs(challenge: IChallenge): number {
  return startAtMs(challenge) + challenge.durationSeconds * 1000;
}

/**
 * A player who has already contributed stats can never be treated as "gone":
 * once a submission lands, only time (the race window) can forfeit them.
 * A disconnected player is given DISCONNECT_GRACE_MS to reconnect and resume;
 * an unknown/missing disconnectedAt (legacy data) is treated as gone so the
 * room can never be stuck waiting on a phantom.
 */
function leaverHasGone(player: ChallengePlayer, raceOver: boolean, now: number): boolean {
  if (player.stats) return false;
  if (!player.connected) {
    return player.disconnectedAt == null || now - player.disconnectedAt.getTime() >= DISCONNECT_GRACE_MS;
  }
  return raceOver;
}

/**
 * Has a player left a race that is under way?
 *
 * This is the mid-race counterpart of `leaverHasGone` and answers a different
 * question: not "may the survivor be awarded the win?" but "did the opponent
 * actually walk away?". It is true only when the player
 *  - never submitted (a player who already banked stats has finished the race
 *    and closing their browser afterwards is NOT leaving), and
 *  - is disconnected, and has now been gone for at least
 *    RUNNING_DISCONNECT_GRACE_MS (a missing clock is treated as gone so a
 *    phantom can never freeze the survivor's race).
 *
 * A player who is merely slow but still connected is NEVER reported here: a
 * frozen/backgrounded tab keeps racing until the authoritative endAt.
 */
export function opponentLeftRun(
  challenge: IChallenge,
  slot: 'player1' | 'player2',
  now = Date.now()
): boolean {
  const player = playerOf(challenge, slot);
  if (!player || player.stats) return false;
  if (player.connected) return false;
  return player.disconnectedAt == null || now - player.disconnectedAt.getTime() >= RUNNING_DISCONNECT_GRACE_MS;
}

/** The slot of the player who walked away mid-race, if any. */
export function leftRunSlot(challenge: IChallenge, now = Date.now()): 'player1' | 'player2' | null {
  if (challenge.status !== 'RUNNING') return null;
  if (opponentLeftRun(challenge, 'player1', now)) return 'player1';
  if (opponentLeftRun(challenge, 'player2', now)) return 'player2';
  return null;
}

export interface FinalizeResult {
  challenge: IChallenge;
  final: boolean;
  abandoned: boolean;
}

/**
 * Decide whether a RUNNING challenge is legally over and, if so, transition it
 * to COMPLETED/EXPIRED exactly once.
 *
 * The outcome write is guarded by `status: 'RUNNING'` + `round`, so concurrent
 * callers (both players submitting at the same time, or the sweeper racing a
 * submission) can never double-finalize: the first call wins, every other call
 * sees null and re-reads the authoritative document.
 *
 * The challenge is TIMER-AUTHORITATIVE: nothing may finish before `endAt`.
 * Rules, in evaluation order:
 *  - opponent walked away mid-race      → COMPLETED "opponent_left", NO winner,
 *    at any point inside the race window. A leaver is never a winner and never
 *    makes the remaining player a winner: this outranks every rule below, so a
 *    player who submits first can still NOT win by walking away. The remaining
 *    client is redirected back to the challenge lobby (no result screen).
 *  - both players submitted, now ≥ endAt        → COMPLETED, winner by WPM
 *    (equal WPM = draw). Both submissions landing EARLY (clock skew) never
 *    finish the race early; the timer stays authoritative.
 *  - one submitted, opponent merely slow        → COMPLETED "abandoned" once
 *    CHALLENGE_FINISH_GRACE_MS after endAt: the leaver gets zero stats so the
 *    submitter's score is preserved and no phantom win is awarded. The short
 *    grace absorbs the natural clock skew between the two clients submitting
 *    at their own endAt.
 *  - nobody submitted, grace fully lapsed       → EXPIRED (no contest).
 *  - otherwise                                  → left RUNNING (waiting).
 */
export async function finalizeRunningIfDue(doc: IChallenge, now = Date.now()): Promise<FinalizeResult> {
  const treatedAbandoned = (c: IChallenge): boolean => c.status === 'COMPLETED' && c.endedBy === 'abandoned';
  if (doc.status !== 'RUNNING') {
    return { challenge: doc, final: doc.status === 'COMPLETED', abandoned: treatedAbandoned(doc) };
  }
  if (!doc.player2) {
    return { challenge: doc, final: false, abandoned: false };
  }

  const s1 = doc.player1.stats;
  const s2 = doc.player2.stats;
  const endAt = endAtMs(doc);
  const finished = now >= endAt;
  const finishGraceOver = now >= endAt + CHALLENGE_FINISH_GRACE_MS;
  const raceOver = now > endAt + CHALLENGE_GRACE_MS;
  const leaver = (survivor: 'player1' | 'player2'): { player: ChallengePlayer; slot: 'player1' | 'player2' } =>
    survivor === 'player1' ? { player: doc.player2!, slot: 'player2' } : { player: doc.player1, slot: 'player1' };

  let status: Extract<ChallengeStatus, 'COMPLETED' | 'EXPIRED'> | null = null;
  let endedBy: ChallengeEndReason = 'completed';
  let winner: 'player1' | 'player2' | 'draw' | null = null;
  let abandonedBy: 'player1' | 'player2' | null = null;
  let zeroStatsFor: 'player1' | 'player2' | null = null;

  // (1) Highest priority: the opponent actually left the race. No winner, ever.
  const goneSlot = leftRunSlot(doc, now);
  if (goneSlot) {
    status = 'COMPLETED';
    endedBy = 'opponent_left';
    abandonedBy = goneSlot;
  } else if (s1 && s2) {
    if (finished) {
      status = 'COMPLETED';
      endedBy = 'completed';
      winner = s1.wpm !== s2.wpm ? (s1.wpm > s2.wpm ? 'player1' : 'player2') : null;
    }
  } else if (s1 || s2) {
    const survivor: 'player1' | 'player2' = s1 ? 'player1' : 'player2';
    const opponent = leaver(survivor);
    const gone = leaverHasGone(opponent.player, raceOver, now);
    if (gone) {
      status = 'COMPLETED';
      endedBy = 'abandoned';
      abandonedBy = opponent.slot;
      winner = survivor;
      zeroStatsFor = opponent.slot;
    } else if (finishGraceOver) {
      // Their clock ran out and they never submitted: the submitter wins and
      // the non-submitter is zeroed rather than left hanging forever.
      status = 'COMPLETED';
      endedBy = 'abandoned';
      abandonedBy = opponent.slot;
      winner = survivor;
      zeroStatsFor = opponent.slot;
    }
  } else if (raceOver) {
    // The race window elapsed and NEITHER player banked a result. This is a
    // started race, so it must never be turned into a lobby expiry - nobody
    // "failed to join" and the survivor must not be told that. It closes as a
    // no contest with no winner, which is what the race actually was.
    status = 'COMPLETED';
    endedBy = 'expired';
  }

  if (!status) {
    return { challenge: doc, final: false, abandoned: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, unknown> = { status, winner, endedBy, abandonedBy };
  if (zeroStatsFor) {
    patch[`${zeroStatsFor}.stats`] = {
      typedWords: [],
      wpm: 0,
      accuracy: 0,
      correctWords: 0,
      attemptedWords: 0,
      errorsCount: 0,
      submittedAt: new Date(now),
    };
  }

  const finalized = await Challenge.findOneAndUpdate(
    { _id: doc._id, round: doc.round, status: 'RUNNING' },
    { $set: patch } as any,
    { new: true }
  );
  if (!finalized) {
    const fresh = await loadChallengeOrThrow(doc.code);
    return { challenge: fresh, final: fresh.status === 'COMPLETED', abandoned: treatedAbandoned(fresh) };
  }
  return { challenge: finalized, final: true, abandoned: endedBy === 'abandoned' };
}

export async function submitResults(
  challenge: IChallenge,
  user: IUser,
  typedWords: ChallengeTypedWord[],
  round: number
): Promise<{ challenge: IChallenge; final: boolean; abandoned: boolean }> {
  if (challenge.status === 'EXPIRED') throw new ChallengeError('This challenge has expired.', 400);
  const slot = playerSlotOf(challenge, user._id.toString());
  if (!slot) throw new ChallengeError('You are not part of this challenge.', 403);
  if (!isBetweenStatus(challenge.status as ChallengeStatus, 'RUNNING')) {
    // A race voided by the opponent's departure is NOT "not running" in the
    // vague sense - it is a specific, already-decided outcome. Say so, so the
    // client can render the departure instead of a generic failure card.
    if (challenge.endedBy === 'opponent_left') {
      throw new ChallengeError('Your opponent has left the challenge.', 409);
    }
    throw new ChallengeError('This challenge is not running.', 400);
  }
  // Results are strictly round-scoped: a submission from a finished round can
  // never be counted against a newer round (stale round-1 packets are dropped).
  if (round !== challenge.round) {
    throw new ChallengeError('This race has already ended.', 400);
  }

  const start = startAtMs(challenge);
  const end = endAtMs(challenge);
  const durationSeconds = Math.min(challenge.durationSeconds, Math.max(0.1, (end - start) / 1000));
  const stats = computeStats(typedWords, durationSeconds);
  const now = Date.now();

  // Atomic per-slot write: only THIS player's stats are persisted without
  // touching the opponent's snapshot, so two simultaneous submissions can
  // never overwrite each other (the old whole-document save lost updates).
  // Submitting also marks the player connected again (they are demonstrably
  // alive) and clears any pending reconnection clock.
  const updated = await Challenge.findOneAndUpdate(
    {
      _id: challenge._id,
      status: 'RUNNING',
      round,
      [`${slot}.userId`]: user._id,
      [`${slot}.stats`]: null,
    },
    {
      $set: {
        [`${slot}.stats`]: {
          typedWords,
          wpm: stats.wpm,
          accuracy: stats.accuracy,
          correctWords: stats.correctWords,
          attemptedWords: stats.attemptedWords,
          errorsCount: stats.errorsCount,
          submittedAt: new Date(now),
        },
        [`${slot}.connected`]: true,
        [`${slot}.disconnectedAt`]: null,
      },
    },
    { new: true }
  );

  // The guard failed (double submit, opponent raced to finish, or the room was
  // swept to COMPLETED while we wrote): report whatever state now exists.
  if (!updated) {
    const fresh = await loadChallengeOrThrow(challenge.code);
    return {
      challenge: fresh,
      final: fresh.status === 'COMPLETED',
      abandoned: fresh.endedBy === 'abandoned',
    };
  }

  const result = await finalizeRunningIfDue(updated, now);
  return { challenge: result.challenge, final: result.final, abandoned: result.abandoned };
}

/**
 * Build a fresh text for the next rematch round that NEVER repeats any
 * paragraph already used in this challenge (across every previous round). The
 * returned ids are appended to the document in startRematchIfBothReady so the
 * running no-repeat history grows with each round.
 */
export async function pickFreshText(challenge: IChallenge): Promise<SelectedText> {
  return buildChallengeText(challenge.durationSeconds, usedParagraphIds(challenge));
}

/**
 * Player asks for a rematch. This ONLY sets the caller's rematchReady flag —
 * it never mutates the race. Both players must request a rematch; the START
 * of the next round happens in startRematchIfBothReady, which is race-safe.
 *
 * Returns whether the OPPONENT is already permanently gone (left or past the
 * reconnection grace). When they are, the caller's request is CANCELLED so the
 * requesting player is never left waiting on a ghost — `startRematchIfBothReady`
 * would refuse to start anyway (it requires both players connected), but the
 * requesting side must get a crisp "opponent no longer available" answer rather
 * than an endless "waiting for opponent…".
 */
export async function requestRematch(challenge: IChallenge, user: IUser): Promise<{ challenge: IChallenge; opponentGone: boolean }> {
  const slot = playerSlotOf(challenge, user._id.toString());
  if (!slot) throw new ChallengeError('You are not part of this challenge.', 403);
  if (!isBetweenStatus(challenge.status as ChallengeStatus, 'COMPLETED')) {
    throw new ChallengeError('A rematch is only available after a finished challenge.', 400);
  }
  // A voided race (the opponent left mid-race) has no result to build on and is
  // torn down instead of rematching, so a stale client can never revive it.
  if (challenge.endedBy === 'opponent_left') {
    throw new ChallengeError('This challenge has ended. It cannot be rematched.', 400);
  }
  const now = new Date();
  const updated = await Challenge.findOneAndUpdate(
    {
      _id: challenge._id,
      status: 'COMPLETED',
      [`${slot}.userId`]: user._id,
      expiresAt: { $gt: now },
    },
    { $set: { [`${slot}.rematchReady`]: true, [`${slot}.connected`]: true, [`${slot}.disconnectedAt`]: null } },
    { new: true }
  );
  if (!updated) throw new ChallengeError('This challenge has expired.', 400);

  const opponentSlot = getOpponentSlot(updated, slot);
  const opponent = opponentSlot === 'player1' ? updated.player1 : updated.player2;
  if (opponent && playerIsGone(opponent, Date.now())) {
    const cancelled = await Challenge.findOneAndUpdate(
      {
        _id: challenge._id,
        status: 'COMPLETED',
        [`${slot}.userId`]: user._id,
        [`${slot}.rematchReady`]: true,
        expiresAt: { $gt: now },
      },
      { $set: { [`${slot}.rematchReady`]: false } },
      { new: true }
    );
    return { challenge: cancelled ?? updated, opponentGone: true };
  }
  return { challenge: updated, opponentGone: false };
}

export interface ResolvePendingRematchResult {
  cancelled: boolean;
  challenge: IChallenge;
}

/**
 * Sweeper/authoritative resolution for a COMPLETED room with a pending rematch:
 * once EITHER player is permanently gone (explicitly left or past the
 * reconnection grace), the pending rematch is cancelled (both flags reset) so
 * the waiting player is never left on "Starting Round N+1…" forever. Both flags
 * are reset because a fresh rematch requires BOTH players to re-opt-in after a
 * lost opponent. Returns cancelled=false (no write) while everyone is online or
 * within the grace window, so a temporary drop is never treated as a leave.
 */
export async function resolvePendingRematch(challenge: IChallenge, now = Date.now()): Promise<ResolvePendingRematchResult> {
  const someoneWaiting = challenge.player1.rematchReady || Boolean(challenge.player2?.rematchReady);
  if (!someoneWaiting) return { cancelled: false, challenge };
  const p1Gone = playerIsGone(challenge.player1, now);
  const p2Gone = challenge.player2 ? playerIsGone(challenge.player2, now) : true;
  if (!p1Gone && !p2Gone) return { cancelled: false, challenge };

  const updated = await Challenge.findOneAndUpdate(
    {
      _id: challenge._id,
      status: 'COMPLETED',
      $or: [{ 'player1.rematchReady': true }, { 'player2.rematchReady': true }],
    },
    { $set: { 'player1.rematchReady': false, 'player2.rematchReady': false } },
    { new: true }
  );
  return { cancelled: Boolean(updated), challenge: updated ?? challenge };
}

/**
 * Race-safe rematch start: creates AND STARTS the NEXT round exactly once.
 *
 * The atomic condition is unchanged — status COMPLETED, both players'
 * rematchReady flags AND both still connected. When two players click
 * "Rematch" at the same time, both call this, but only ONE
 * findOneAndUpdate can win, because the update moves the room OUT of
 * COMPLETED (into RUNNING) and resets the flags; the losing call's condition
 * no longer matches and it returns null. Exactly one new round, one new text
 * and one shared startTime can ever be created for a completed match.
 *
 * The round goes straight to RUNNING instead of back through the
 * "Ready to Battle?" lobby: both players already opted in by asking for the
 * rematch, so that is treated as both of them being ready. `startAt` is a
 * short shared lead (REMATCH_START_DELAY_MS) so the player who clicked first
 * is not mid-word when the second click lands — both clients count the same
 * server-timestamped countdown down before the race goes live.
 *
 * `freshText` is picked BEFORE the atomic write so a pool failure aborts
 * without touching the document. Its paragraph ids APPEND to the challenge's
 * running no-repeat history so later rounds keep excluding them.
 */
export async function startRematchIfBothReady(code: string, freshText: SelectedText): Promise<IChallenge | null> {
  const now = new Date();
  return Challenge.findOneAndUpdate(
    {
      code: code.trim().toUpperCase(),
      status: 'COMPLETED',
      'player1.rematchReady': true,
      'player2.rematchReady': true,
      'player1.connected': true,
      'player2.connected': true,
      expiresAt: { $gt: now },
    },
    {
      $inc: { round: 1 },
      $set: {
        status: 'RUNNING',
        winner: null,
        // A new round is a genuinely fresh race, so the PREVIOUS round's ending
        // must not ride along: a client that reads `endedBy` while status is
        // RUNNING would otherwise see a stale 'completed' (or, worse, an
        // 'abandoned' from an earlier round) and could treat the live race as
        // already over. Same for the slot that walked away last time.
        endedBy: null,
        abandonedBy: null,
        startAt: new Date(now.getTime() + REMATCH_START_DELAY_MS),
        text: freshText.content,
        'player1.ready': false,
        'player1.readyAt': null,
        'player1.rematchReady': false,
        'player1.stats': null,
        'player2.ready': false,
        'player2.readyAt': null,
        'player2.rematchReady': false,
        'player2.stats': null,
        expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
      },
      $push: { paragraphIds: { $each: freshText.paragraphIds } },
    },
    { new: true }
  );
}

export async function rematchChallenge(
  challenge: IChallenge,
  user: IUser
): Promise<{ challenge: IChallenge; opponentGone: boolean }> {
  return requestRematch(challenge, user);
}

export async function leaveChallenge(challenge: IChallenge, userId: string): Promise<IChallenge> {
  const slot = playerSlotOf(challenge, userId);
  if (!slot) return challenge;
  if (isBetweenStatus(challenge.status as ChallengeStatus, 'WAITING', 'PLAYER_JOINED', 'READY')) {
    // Who is left to tell? A solo room dying as EXPIRED is correct - the creator
    // walked away from an empty lobby and the link should stop working. The
    // moment an opponent is SEATED, walking away is a DEPARTURE, not a lobby
    // timeout: the survivor must be released immediately and must never be
    // shown the "no opponent joined in N minutes" card.
    const survivorSeated = slot === 'player2' || challenge.player2 !== null;
    if (survivorSeated) {
      const ended = await Challenge.findOneAndUpdate(
        {
          _id: challenge._id,
          round: challenge.round,
          status: { $in: ['WAITING', 'PLAYER_JOINED', 'READY'] },
        },
        { $set: { status: 'COMPLETED', winner: null, endedBy: 'opponent_left', abandonedBy: slot } },
        { new: true }
      );
      if (ended) return ended;
    }
    challenge.set('status', 'EXPIRED');
    challenge.set('winner', null);
    challenge.set('endedBy', 'expired');
    challenge.set('abandonedBy', null);
  } else if (challenge.status === 'RUNNING') {
    const player = playerOf(challenge, slot);
    player.connected = false;
    if (!player.disconnectedAt) player.disconnectedAt = new Date();
    challenge.markModified(slot);
    // An INTENTIONAL leave from a live race is not a network blip, so it must
    // not wait out the reconnect grace: the room ends right now, as a no
    // contest (winner stays null). A player who already banked their stats has
    // finished the race — closing the browser afterwards is normal end-of-race
    // behaviour and must not void a legitimately finished race, so that case
    // keeps the plain disconnect marking and resolves on the normal timer path.
    if (!player.stats) {
      const ended = await Challenge.findOneAndUpdate(
        { _id: challenge._id, round: challenge.round, status: 'RUNNING' },
        { $set: { status: 'COMPLETED', winner: null, endedBy: 'opponent_left', abandonedBy: slot } },
        { new: true }
      );
      if (ended) return ended;
    }
  } else if (challenge.status === 'COMPLETED') {
    // A player who explicitly leaves a finished challenge is permanently
    // gone from the rematch window, NOT a transient network drop. Backdate the
    // reconnection clock past the grace window so the opponent's authoritative
    // presence reads "left" immediately (a rematch can never start against a
    // ghost, and the requesting player is never stuck "waiting").
    const player = playerOf(challenge, slot);
    player.connected = false;
    player.disconnectedAt = new Date(Date.now() - DISCONNECT_GRACE_MS - 1000);
    // Cancel any pending rematch request this player made, mirroring the
    // "cancel the pending rematch" rule once a player is gone.
    player.rematchReady = false;
    challenge.markModified(slot);
  }
  return challenge.save();
}

export function challengeRoom(code: string): string {
  return `challenge:${code.trim().toUpperCase()}`;
}

export function effectiveDurationMs(challenge: IChallenge): number {
  return challenge.durationSeconds * 1000;
}

export function isOverdue(challenge: IChallenge, now = Date.now()): boolean {
  return challenge.status === 'RUNNING' && now > endAtMs(challenge) + CHALLENGE_GRACE_MS;
}