import { Request, Response, NextFunction } from 'express';
type HttpError = Error & {
    status?: number;
    type?: string;
};
export declare function errorHandler(err: HttpError, _req: Request, res: Response, _next: NextFunction): void;
export {};
//# sourceMappingURL=errorHandler.middleware.d.ts.map