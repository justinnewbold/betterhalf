import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initialize: () => void;
}

// Custom storage that works for both web and native
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(name);
    }
    return AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(name, value);
      return;
    }
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(name);
      return;
    }
    await AsyncStorage.removeItem(name);
  },
};

const getSystemTheme = (): boolean => {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === 'dark';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark' as ThemeMode, // Default to dark for existing users
      isDark: true,

      setMode: (mode: ThemeMode) => {
        let isDark: boolean;
        
        if (mode === 'system') {
          isDark = getSystemTheme();
        } else {
          isDark = mode === 'dark';
        }
        
        set({ mode, isDark });
      },

      toggleTheme: () => {
        const { mode, isDark } = get();
        
        if (mode === 'system') {
          // If on system, switch to opposite of current
          set({ mode: isDark ? 'light' : 'dark', isDark: !isDark });
        } else {
          // Toggle between light and dark
          const newMode = mode === 'dark' ? 'light' : 'dark';
          set({ mode: newMode, isDark: newMode === 'dark' });
        }
      },

      initialize: () => {
        const { mode } = get();
        
        if (mode === 'system') {
          set({ isDark: getSystemTheme() });
        }

        // Listen for system theme changes
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
          const { mode } = get();
          if (mode === 'system') {
            set({ isDark: colorScheme === 'dark' });
          }
        });

        return () => subscription.remove();
      },
    }),
    {
      name: 'betterhalf-theme',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);