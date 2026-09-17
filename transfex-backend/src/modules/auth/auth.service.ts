import { ApiError } from '../../utils/ApiError';
import { hashPassword, verifyPassword, DUMMY_HASH } from '../../utils/password';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
} from '../../utils/tokens';
import * as repo from './auth.repository';
import { toPublicUser, type PublicUser, type Role } from './auth.types';
import type { RegisterInput, LoginInput } from './auth.schemas';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function issueTokenPair(userId: string, role: Role): Promise<TokenPair> {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = generateRefreshToken();
  await repo.insertRefreshToken({
    userId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshTokenExpiry(),
  });
  return { accessToken, refreshToken };
}

export async function register(
  input: RegisterInput
): Promise<{ user: PublicUser } & TokenPair> {
  const existing = await repo.findUserByEmail(input.email);
  if (existing) {
    // Register is the one place it's fine to say the email is taken —
    // the person is trying to create an account with it, not probe for one.
    throw ApiError.conflict('That email is already registered. Sign in instead.');
  }

  const passwordHash = await hashPassword(input.password);
  // First account on the system runs it. Everyone after starts as staff.
  const role: Role = (await repo.countUsers()) === 0 ? 'admin' : 'staff';

  const user = await repo.createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role,
  });

  const tokens = await issueTokenPair(user.id, user.role);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: LoginInput): Promise<{ user: PublicUser } & TokenPair> {
  const user = await repo.findUserByEmail(input.email);

  // Verify against a real hash either way, so a nonexistent account doesn't
  // return measurably faster than a wrong password (email enumeration via timing).
  const valid = await verifyPassword(user?.password_hash ?? (await DUMMY_HASH), input.password);

  if (!user || !valid) {
    throw ApiError.unauthorized('Email or password is incorrect.');
  }

  const tokens = await issueTokenPair(user.id, user.role);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(rawToken: string): Promise<TokenPair> {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await repo.findRefreshToken(tokenHash);

  if (!stored) {
    throw ApiError.unauthorized('Session expired. Please sign in again.');
  }

  if (stored.revoked_at) {
    // This exact token was already used once (or explicitly logged out) and
    // is being presented again — the only way that happens is if it leaked.
    // Kill every session for the account, not just this one.
    await repo.revokeAllUserRefreshTokens(stored.user_id);
    throw ApiError.unauthorized('Session expired. Please sign in again.');
  }

  if (stored.expires_at.getTime() < Date.now()) {
    throw ApiError.unauthorized('Session expired. Please sign in again.');
  }

  const user = await repo.findUserById(stored.user_id);
  if (!user) {
    throw ApiError.unauthorized('Session expired. Please sign in again.');
  }

  // Rotate: this token is now spent, a new one takes its place.
  await repo.revokeRefreshToken(tokenHash);
  return issueTokenPair(user.id, user.role);
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  await repo.revokeRefreshToken(hashRefreshToken(rawToken));
}

export async function getById(userId: string): Promise<PublicUser> {
  const user = await repo.findUserById(userId);
  if (!user) throw ApiError.unauthorized();
  return toPublicUser(user);
}
