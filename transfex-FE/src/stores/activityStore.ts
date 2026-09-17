import { create } from 'zustand';
import type { ActivityItem } from '../types';
import { api, ApiError } from '../lib/apiClient';

interface ActivityStore {
  activities: ActivityItem[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchActivities: (limit?: number) => Promise<void>;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  activities: [],
  loading: false,
  loaded: false,
  error: null,

  fetchActivities: async (limit = 8) => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ activities: ActivityItem[] }>('/api/activity', {
        limit,
      });
      set({ activities: data.activities, loading: false, loaded: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not load activity.';
      set({ loading: false, error: message });
    }
  },
}));