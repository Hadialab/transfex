import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '../modules/auth/auth.types';

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload) {
  const options: jwt.SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/** The value actually sent to the client and stored in the cookie. Random, not a JWT — it's a bearer credential looked up in refresh_tokens, so it can be revoked server-side (a JWT refresh token can't be invalidated before it expires). */
export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

/** Only the hash is stored in the database — a stolen DB dump doesn't hand out working session tokens. */
export function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry() {
  const days = env.REFRESH_TOKEN_TTL_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
