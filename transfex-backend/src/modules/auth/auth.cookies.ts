import type { Response } from 'express';
import { isProd, env } from '../../config/env';

const REFRESH_COOKIE = 'transfex_refresh';

const baseOptions = {
  httpOnly: true,
  secure: isProd, // requires HTTPS in production; allow http locally for dev
  sameSite: 'strict' as const,
  path: '/api/auth', // only sent to auth routes, not the whole API surface
};

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, baseOptions);
}

export function getRefreshCookie(req: { cookies?: Record<string, string> }): string | undefined {
  return req.cookies?.[REFRESH_COOKIE];
}
