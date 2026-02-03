import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initialize: () => Promise<void>;
}

const STORAGE_KEY = 'betterhalf-theme-mode';

const getSystemTheme = (): boolean => {
  try {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark';
  } catch (error) {
    console.warn('[ThemeStore] Error getting system theme:', error);
    return true; // Default to dark
  }
};

const saveThemeMode = async (mode: ThemeMode): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, mode);
      }
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    }
  } catch (error) {
    console.warn('[ThemeStore] Error saving theme:', error);
  }
};

const loadThemeMode = async (): Promise<ThemeMode | null> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      }
      return null;
    }
    return await AsyncStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  } catch (error) {
    console.warn('[ThemeStore] Error loading theme:', error);
    return null;
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark' as ThemeMode, // Default to dark
  isDark: true,
  isHydrated: false,

  setMode: (mode: ThemeMode) => {
    let isDark: boolean;
    
    if (mode === 'system') {
      isDark = getSystemTheme();
    } else {
      isDark = mode === 'dark';
    }
    
    set({ mode, isDark });
    saveThemeMode(mode);
  },

  toggleTheme: () => {
    const { mode, isDark } = get();
    
    let newMode: ThemeMode;
    let newIsDark: boolean;
    
    if (mode === 'system') {
      // If on system, switch to opposite of current
      newMode = isDark ? 'light' : 'dark';
      newIsDark = !isDark;
    } else {
      // Toggle between light and dark
      newMode = mode === 'dark' ? 'light' : 'dark';
      newIsDark = newMode === 'dark';
    }
    
    set({ mode: newMode, isDark: newIsDark });
    saveThemeMode(newMode);
  },

  initialize: async () => {
    try {
      // Load saved theme mode
      const savedMode = await loadThemeMode();
      
      if (savedMode) {
        let isDark: boolean;
        if (savedMode === 'system') {
          isDark = getSystemTheme();
        } else {
          isDark = savedMode === 'dark';
        }
        set({ mode: savedMode, isDark, isHydrated: true });
      } else {
        // No saved preference, default to dark
        set({ mode: 'dark', isDark: true, isHydrated: true });
      }

      // Listen for system theme changes
      Appearance.addChangeListener(({ colorScheme }) => {
        const { mode } = get();
        if (mode === 'system') {
          set({ isDark: colorScheme === 'dark' });
        }
      });
    } catch (error) {
      console.warn('[ThemeStore] Error in initialize:', error);
      set({ isHydrated: true }); // Mark as hydrated even on error
    }
  },
}));
