import { Request, Response, NextFunction } from 'express';

type HttpError = Error & { status?: number; type?: string };

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.type === 'entity.too.large' || err.status === 413) {
    res.status(413).json({ success: false, error: 'Request body too large' });
    return;
  }
  console.error(
    `[error] ${new Date().toISOString()} ${_req.method} ${_req.originalUrl} -> ${err.status ?? 500}:`,
    err?.stack || err
  );
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected server error occurred.',
  });
}
