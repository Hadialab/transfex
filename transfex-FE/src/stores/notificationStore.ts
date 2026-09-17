import { create } from 'zustand';
import type { Notification } from '../types';
import { api, ApiError } from '../lib/apiClient';

interface NotificationStore {
  notifications: Notification[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  unreadCount: () => number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  // Local-only helpers kept for interface compatibility. They do NOT sync
  // to the server - the DB is the source of truth.
  clearAll: () => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  loading: false,
  loaded: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ notifications: Notification[] }>(
        '/api/notifications'
      );
      set({ notifications: data.notifications, loading: false, loaded: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not load notifications.';
      set({ loading: false, error: message });
    }
  },

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  markAsRead: async (id) => {
    // Optimistic: badge updates instantly, rollback on failure.
    const before = get().notifications;
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
    try {
      await api.patch(`/api/notifications/${id}/read`);
    } catch {
      set({ notifications: before });
    }
  },

  markAllAsRead: async () => {
    const before = get().notifications;
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    try {
      await api.patch('/api/notifications/read-all');
    } catch {
      set({ notifications: before });
    }
  },

  clearAll: () => set({ notifications: [] }),

  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
}));