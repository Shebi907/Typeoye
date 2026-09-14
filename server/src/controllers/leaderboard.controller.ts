import { Request, Response } from 'express';
import TypingResult from '../models/TypingResult';
import Profile from '../models/Profile';
import User from '../models/User';
import Lesson from '../models/Lesson';
import LessonProgress from '../models/LessonProgress';
import PlatformSetting from '../models/PlatformSetting';
import { deriveCurrentLearnLevel } from '../services/session.service';
import { sendSuccess, sendError } from '../utils/response';

const PERIODS = ['global', 'daily', 'weekly', 'monthly'] as const;
export type LeaderboardPeriod = (typeof PERIODS)[number];

const DEFAULT_MIN_ACCURACY = 90;
const DEFAULT_TOP_LIMIT = 50;
const LEADERBOARD_MODES = ['test', 'game'];

interface LeaderboardConfig {
  minAccuracy: number;
  topLimit: number;
}

/** Read admin-configurable leaderboard settings from the DB (fall back to defaults). */
async function loadConfig(): Promise<LeaderboardConfig> {
  const rows = await PlatformSetting.find({
    key: { $in: ['leaderboard.minAccuracy', 'leaderboard.topLimit'] },
  }).lean();
  let minAccuracy = DEFAULT_MIN_ACCURACY;
  let topLimit = DEFAULT_TOP_LIMIT;
  for (const row of rows) {
    if (row.key === 'leaderboard.minAccuracy' && typeof row.value === 'number') minAccuracy = row.value;
    if (row.key === 'leaderboard.topLimit' && typeof row.value === 'number') topLimit = row.value;
  }
  return { minAccuracy, topLimit };
}

interface RankedEntry {
  rank: number;
  userId: unknown;
  wpm: number;
  accuracy: number;
  createdAt: Date;
}

function periodSince(period: LeaderboardPeriod): Date | null {
  if (period === 'global') return null;
  const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - days);
  return since;
}

function baseMatch(since: Date | null, minAccuracy: number): Record<string, unknown> {
  const match: Record<string, unknown> = {
    userId: { $exists: true, $ne: null },
    accuracy: { $gte: minAccuracy },
    mode: { $in: LEADERBOARD_MODES },
  };
  if (since) match.createdAt = { $gte: since };
  return match;
}

/**
 * One entry per user: their fastest qualifying result (with that result's
 * accuracy). Only signed-in users are ranked - guest activity is never stored
 * and never appears on the leaderboard.
 */
async function buildRankedEntries(since: Date | null, minAccuracy: number): Promise<RankedEntry[]> {
  const rows = await TypingResult.aggregate([
    { $match: baseMatch(since, minAccuracy) },
    { $sort: { wpm: -1, createdAt: 1 } },
    {
      $group: {
        _id: '$userId',
        userId: { $first: '$userId' },
        wpm: { $first: '$wpm' },
        accuracy: { $first: '$accuracy' },
        createdAt: { $first: '$createdAt' },
      },
    },
    { $sort: { wpm: -1, createdAt: 1 } },
  ]);

  return rows.map((row, idx) => ({
    rank: idx + 1,
    userId: row.userId,
    wpm: row.wpm,
    accuracy: row.accuracy,
    createdAt: row.createdAt,
  }));
}

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const config = await loadConfig();
    const rawPeriod = (req.query['period'] as string) || 'global';
    const limit = Math.min(config.topLimit, parseInt(req.query['limit'] as string) || config.topLimit);

    if (!PERIODS.includes(rawPeriod as LeaderboardPeriod)) {
      sendError(res, 'Invalid period. Use global, weekly, or monthly', 400);
      return;
    }
    const period = rawPeriod as LeaderboardPeriod;
    const since = periodSince(period);

    const ranked = await buildRankedEntries(since, config.minAccuracy);
    const top = ranked.slice(0, limit);

    // Enrich with user info.
    const topIds = top
      .map((e) => e.userId)
      .filter((id): id is NonNullable<typeof id> => id != null);
    const currentUserId = req.user?._id?.toString();
    const allIds =
      currentUserId && !topIds.some((id) => String(id) === currentUserId)
        ? [...topIds, currentUserId]
        : topIds;

    const [users, profiles, activeLessons, progressDocs] = await Promise.all([
      User.find({ _id: { $in: allIds } }).select('username').lean(),
      Profile.find({ userId: { $in: allIds } }).select('userId displayName').lean(),
      Lesson.find({ isActive: true }).sort({ order: 1 }).select('_id order').lean(),
      LessonProgress.find({ userId: { $in: allIds }, completedAt: { $exists: true } }).select('userId lessonId').lean(),
    ]);

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const completedByUser = new Map<string, string[]>();
    for (const doc of progressDocs) {
      const key = doc.userId.toString();
      if (!completedByUser.has(key)) completedByUser.set(key, []);
      completedByUser.get(key)!.push(doc.lessonId.toString());
    }

    // The level shown on the leaderboard is the user's CURRENT LEARN LEVEL
    // (the first unlocked but not-yet-completed lesson — the same level the
    // Learn page shows), NOT Profile.level which is the XP/gamification level.
    const currentLearnLevel = (userId: unknown): number =>
      deriveCurrentLearnLevel(activeLessons, completedByUser.get(String(userId)) ?? []);

    const leaderboard = top.map((entry) => {
      const id = String(entry.userId);
      const u = userMap.get(id);
      const p = profileMap.get(id);
      return {
        rank: entry.rank,
        userId: entry.userId,
        username: u?.username ?? 'Unknown',
        displayName: p?.displayName ?? u?.username ?? 'Unknown',
        level: currentLearnLevel(id),
        wpm: entry.wpm,
        accuracy: entry.accuracy,
        isMe: currentUserId ? id === currentUserId : false,
      };
    });

    // Current user's own rank — read from the same ranked list as the board so
    // rank, ties and period filtering are always consistent with what is shown.
    let me: Record<string, unknown> | null = null;
    if (currentUserId) {
      const meEntry = ranked.find((entry) => String(entry.userId) === currentUserId);
      if (meEntry) {
        const myUser = userMap.get(currentUserId);
        const myProfile = profileMap.get(currentUserId);
        me = {
          rank: meEntry.rank,
          userId: req.user!._id,
          username: myUser?.username ?? 'You',
          displayName: myProfile?.displayName ?? myUser?.username ?? 'You',
          level: currentLearnLevel(currentUserId),
          wpm: meEntry.wpm,
          accuracy: meEntry.accuracy,
        };
      }
    }

    sendSuccess(res, { leaderboard, period, me });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    sendError(res, 'Failed to fetch leaderboard', 500);
  }
}