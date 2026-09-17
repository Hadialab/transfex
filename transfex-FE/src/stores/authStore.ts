import { create } from 'zustand';
import { api, ApiError, setAccessToken, setAuthFailureHandler } from '../lib/apiClient';

export type Role = 'admin' | 'staff';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  /** True while the app is doing its one-time silent-refresh check on load. */
  initializing: boolean;
  loading: boolean;
  error: string | null;
  register: (input: { name: string; email: string; password: string }) => Promise<boolean>;
  login: (input: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  /** Call once on app mount: tries the httpOnly refresh cookie, then /me. */
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // If any request anywhere gets a 401 that a silent refresh can't fix,
  // the session is over — drop the user so RequireAuth sends them to /login.
  setAuthFailureHandler(() => set({ user: null }));

  return {
    user: null,
    initializing: true,
    loading: false,
    error: null,

    clearError: () => set({ error: null }),

    register: async ({ name, email, password }) => {
      set({ loading: true, error: null });
      try {
        const data = await api.post<{ user: AuthUser; accessToken: string }>('/api/auth/register', {
          name,
          email,
          password,
        });
        setAccessToken(data.accessToken);
        set({ user: data.user, loading: false });
        return true;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Something went wrong. Try again.';
        set({ loading: false, error: message });
        return false;
      }
    },

    login: async ({ email, password }) => {
      set({ loading: true, error: null });
      try {
        const data = await api.post<{ user: AuthUser; accessToken: string }>('/api/auth/login', {
          email,
          password,
        });
        setAccessToken(data.accessToken);
        set({ user: data.user, loading: false });
        return true;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Something went wrong. Try again.';
        set({ loading: false, error: message });
        return false;
      }
    },

    logout: () => {
      // Fire and forget — the cookie clears server-side regardless of whether
      // the caller waits, and we want the UI to feel instant.
      api.post('/api/auth/logout').catch(() => {});
      setAccessToken(null);
      set({ user: null, error: null });
    },

    bootstrap: async () => {
      try {
        // No refresh token cookie, an expired one, etc. all just fail here —
        // that's the normal "not signed in" case, not an error to surface.
        const refreshed = await api.post<{ accessToken: string }>('/api/auth/refresh');
        setAccessToken(refreshed.accessToken);
        const me = await api.get<{ user: AuthUser }>('/api/auth/me');
        set({ user: me.user });
      } catch {
        setAccessToken(null);
        set({ user: null });
      } finally {
        set({ initializing: false });
      }
    },
  };
});