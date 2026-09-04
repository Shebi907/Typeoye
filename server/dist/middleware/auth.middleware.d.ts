import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Attaches `req.user` when a valid token is present, but never fails the
 * request — public/guest endpoints use this so signed-in visitors still get
 * personalization (progress, weak keys, "me" rows) while guests are allowed in.
 */
export declare function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void>;
export declare function requireAdmin(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map