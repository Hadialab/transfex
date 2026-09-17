import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'admin' | 'staff';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface StoredUser extends AuthUser {
  salt: string;
  passwordHash: string;
}

interface AuthState {
  users: StoredUser[];
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  register: (input: { name: string; email: string; password: string }) => Promise<boolean>;
  login: (input: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  seedDemoAccount: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Password helpers                                                    */
/* ------------------------------------------------------------------ */

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function makeSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

/**
 * Salted SHA-256. Adequate for a local demo, NOT adequate for production —
 * SHA-256 is fast by design and therefore cheap to brute-force. When a real
 * backend exists, hash with argon2id or bcrypt on the server and delete this.
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function publicUser(u: StoredUser): AuthUser {
  const { salt: _salt, passwordHash: _hash, ...rest } = u;
  return rest;
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      user: null,
      loading: false,
      error: null,

      clearError: () => set({ error: null }),

      register: async ({ name, email, password }) => {
        set({ loading: true, error: null });
        const cleanEmail = normalizeEmail(email);

        if (get().users.some((u) => u.email === cleanEmail)) {
          set({ loading: false, error: 'That email is already registered. Sign in instead.' });
          return false;
        }

        const salt = makeSalt();
        const passwordHash = await hashPassword(password, salt);

        const newUser: StoredUser = {
          id: crypto.randomUUID(),
          name: name.trim(),
          email: cleanEmail,
          // First account to exist runs the place.
          role: get().users.length === 0 ? 'admin' : 'staff',
          createdAt: new Date().toISOString(),
          salt,
          passwordHash,
        };

        set((state) => ({
          users: [...state.users, newUser],
          user: publicUser(newUser),
          loading: false,
        }));
        return true;
      },

      login: async ({ email, password }) => {
        set({ loading: true, error: null });
        const cleanEmail = normalizeEmail(email);
        const match = get().users.find((u) => u.email === cleanEmail);

        // Hash regardless of whether the account exists, so a missing account
        // and a wrong password take the same amount of time to fail.
        const attempt = await hashPassword(password, match?.salt ?? 'no-such-user');

        if (!match || attempt !== match.passwordHash) {
          set({ loading: false, error: 'Email or password is incorrect.' });
          return false;
        }

        set({ user: publicUser(match), loading: false });
        return true;
      },

      logout: () => set({ user: null, error: null }),

      seedDemoAccount: async () => {
        if (get().users.length > 0) return;
        await get().register({
          name: 'Hadi',
          email: 'admin@transfex.io',
          password: 'transfex123',
        });
        // Seeding shouldn't drop you straight into the dashboard.
        set({ user: null });
      },
    }),
    {
      name: 'transfex-auth',
      partialize: (state) => ({ users: state.users, user: state.user }),
    }
  )
);
