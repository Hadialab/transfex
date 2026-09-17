import { create } from 'zustand';
import {
  api,
  ApiError,
  setAccessToken,
  setAuthFailureHandler,
  refreshSession,
} from '../lib/apiClient';

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
  initializing: boolean;
  loading: boolean;
  error: string | null;
  register: (input: { name: string; email: string; password: string }) => Promise<boolean>;
  login: (input: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
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
        const data = await api.post<{ user: AuthUser; accessToken: string }>(
          '/api/auth/register',
          { name, email, password }
        );
        setAccessToken(data.accessToken);
        set({ user: data.user, loading: false });
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Something went wrong. Try again.';
        set({ loading: false, error: message });
        return false;
      }
    },

    login: async ({ email, password }) => {
      set({ loading: true, error: null });
      try {
        const data = await api.post<{ user: AuthUser; accessToken: string }>(
          '/api/auth/login',
          { email, password }
        );
        setAccessToken(data.accessToken);
        set({ user: data.user, loading: false });
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Something went wrong. Try again.';
        set({ loading: false, error: message });
        return false;
      }
    },

    logout: () => {
      api.post('/api/auth/logout').catch(() => {});
      setAccessToken(null);
      set({ user: null, error: null });
    },

    bootstrap: async () => {
      try {
        // Uses the same single-flight refresh as the 401-retry path.
        // Without that, a page load with several parallel data fetches fires
        // multiple refresh calls, each rotates the token, and the backend's
        // reuse detection revokes every session.
        const token = await refreshSession();
        if (!token) {
          set({ user: null });
          return;
        }
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