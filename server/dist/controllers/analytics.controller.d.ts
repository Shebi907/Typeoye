import { Request, Response } from 'express';
export declare function getWpmTrend(req: Request, res: Response): Promise<void>;
export declare function getAccuracyTrend(req: Request, res: Response): Promise<void>;
export declare function getWeakKeys(req: Request, res: Response): Promise<void>;
export declare function getSummary(req: Request, res: Response): Promise<void>;
export declare function getHistory(req: Request, res: Response): Promise<void>;
export declare function getDashboardData(req: Request, res: Response): Promise<void>;
/** Per-user progress summary for /progress: per-mode stats, learning totals,
 *  recent sessions per mode, and the 30-day WPM trend. */
export declare function getProgress(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=analytics.controller.d.ts.map