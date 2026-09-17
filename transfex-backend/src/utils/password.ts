import argon2 from 'argon2';

export function hashPassword(plain: string) {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, plain: string) {
  return argon2.verify(hash, plain);
}

// A real hash of an unguessable password, computed once at startup. Used so
// argon2.verify() still runs (and takes real time) when the email doesn't
// exist, instead of short-circuiting — otherwise "no such user" resolves
// measurably faster than "wrong password" and an attacker can enumerate
// registered emails purely from response timing.
export const DUMMY_HASH = argon2.hash('a-constant-decoy-password-never-used-for-login');
