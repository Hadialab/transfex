import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import type { Role } from '../modules/auth/auth.types';

/** Use after requireAuth. e.g. router.delete('/:id', requireAuth, requireRole('admin'), ...) */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}
