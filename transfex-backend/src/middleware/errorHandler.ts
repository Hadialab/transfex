import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { isProd } from '../config/env';
import { logger } from '../config/logger';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.path}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const flat = err.flatten();
    // Root-level checks (e.g. `.refine()` with no field path, like "provide
    // at least one field to update") land in formErrors, not fieldErrors —
    // without this they'd silently vanish and the client would just see
    // "Validation failed" with no explanation.
    const message = flat.formErrors[0] ?? 'Validation failed';
    res.status(400).json({ error: { message, details: flat.fieldErrors } });
    return;
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, err.message);
    }
    res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    return;
  }

  // Unexpected error: log the real thing, but never hand the client a stack
  // trace or driver error text — that's the verbose-error-response class
  // from the Coderaas audit.
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: { message: isProd ? 'Something went wrong' : (err as Error)?.message ?? 'Something went wrong' },
  });
}
