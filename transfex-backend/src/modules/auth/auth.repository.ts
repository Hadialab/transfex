import { query } from '../../db/pool';
import type { UserRow, Role } from './auth.types';

export async function countUsers(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
  return Number(result.rows[0].count);
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}): Promise<UserRow> {
  const result = await query<UserRow>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.name, input.email, input.passwordHash, input.role]
  );
  return result.rows[0];
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export async function insertRefreshToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [input.userId, input.tokenHash, input.expiresAt]
  );
}

export async function findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
  const result = await query<RefreshTokenRow>(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
    [tokenHash]
  );
}

/** Nukes every session for a user. Called on logout-everywhere and on detected refresh-token reuse (a strong signal the token was stolen). */
export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
}
