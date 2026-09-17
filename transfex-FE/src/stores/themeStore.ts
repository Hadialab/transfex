import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
  setDark: (value: boolean) => void;
}

/**
 * Only owns the boolean. Applying it to the DOM happens in one place
 * (the effect in App.tsx) so the two can't drift out of sync.
 * Storage key is duplicated in the no-flash script in index.html.
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: true,
      toggle: () => set((state) => ({ isDark: !state.isDark })),
      setDark: (value) => set({ isDark: value }),
    }),
    { name: 'transfex-theme' }
  )
);