import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from '../types';
import { mockNotifications } from '../data/mockData';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: () => number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: mockNotifications,
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      addNotification: (notification) =>
        set((state) => ({ notifications: [notification, ...state.notifications] })),
      clearAll: () => set({ notifications: [] }),
    }),
    { name: 'transfex-notifications' }
  )
);
