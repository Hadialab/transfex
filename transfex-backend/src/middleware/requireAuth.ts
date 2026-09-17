import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/tokens';
import { ApiError } from '../utils/ApiError';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized());
  }

  const token = header.slice('Bearer '.length);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Access token expired'));
    }
    return next(ApiError.unauthorized('Invalid access token'));
  }
}
