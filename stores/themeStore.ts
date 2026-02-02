import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initialize: () => void;
  setHydrated: (hydrated: boolean) => void;
}

// Custom storage that works for both web and native with error handling
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(name);
      }
      return await AsyncStorage.getItem(name);
    } catch (error) {
      console.warn('[ThemeStore] Error reading storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(name, value);
        return;
      }
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.warn('[ThemeStore] Error writing storage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(name);
        return;
      }
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.warn('[ThemeStore] Error removing from storage:', error);
    }
  },
};

const getSystemTheme = (): boolean => {
  try {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark';
  } catch (error) {
    console.warn('[ThemeStore] Error getting system theme:', error);
    return true; // Default to dark
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark' as ThemeMode, // Default to dark for existing users
      isDark: true,
      isHydrated: false,

      setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),

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
        try {
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
        } catch (error) {
          console.warn('[ThemeStore] Error in initialize:', error);
        }
      },
    }),
    {
      name: 'betterhalf-theme',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete
        if (state) {
          state.setHydrated(true);
          // Update isDark based on loaded mode
          if (state.mode === 'system') {
            state.isDark = getSystemTheme();
          } else {
            state.isDark = state.mode === 'dark';
          }
        }
      },
    }
  )
);
