import { create } from 'zustand';
import { Platform } from 'react-native';

// Dev test accounts for quick switching
export const DEV_ACCOUNTS = [
  { email: 'justinnewbold@icloud.com', label: 'Justin', emoji: '👨' },
  { email: 'irecon@icloud.com', label: 'Aimee', emoji: '👩' },
] as const;

// Simple storage helper (works on web + native)
const STORAGE_KEY = 'betterhalf-dev-mode';

const loadDevMode = (): boolean => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.sessionStorage?.getItem(STORAGE_KEY) === 'true';
    }
  } catch {}
  return false;
};

const saveDevMode = (enabled: boolean) => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (enabled) {
        window.sessionStorage?.setItem(STORAGE_KEY, 'true');
      } else {
        window.sessionStorage?.removeItem(STORAGE_KEY);
      }
    }
  } catch {}
};

interface DevState {
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
  /** Temporarily stores the password after first login so quick-switch works */
  cachedPassword: string | null;
  setCachedPassword: (pw: string | null) => void;
}

export const useDevStore = create<DevState>((set) => ({
  devMode: loadDevMode(),
  setDevMode: (enabled) => {
    saveDevMode(enabled);
    set({ devMode: enabled });
  },
  cachedPassword: null,
  setCachedPassword: (pw) => set({ cachedPassword: pw }),
}));
