import { Request, Response } from 'express';
declare const PERIODS: readonly ["global", "daily", "weekly", "monthly"];
export type LeaderboardPeriod = (typeof PERIODS)[number];
export declare function getLeaderboard(req: Request, res: Response): Promise<void>;
export {};
//# sourceMappingURL=leaderboard.controller.d.ts.map