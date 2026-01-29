import { create } from 'zustand';
import { Platform } from 'react-native';
import { getSupabase, TABLES } from '../lib/supabase';

interface NotificationPreferences {
  dailyReminder: boolean;
  dailyReminderTime: string; // "09:00"
  partnerAnswered: boolean;
  streakReminder: boolean;
}

interface NotificationStore {
  pushToken: string | null;
  isPermissionGranted: boolean;
  preferences: NotificationPreferences;
  isLoading: boolean;
  
  // Actions
  registerForPushNotifications: (userId: string) => Promise<string | null>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  loadPreferences: (userId: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  reset: () => void;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  dailyReminder: true,
  dailyReminderTime: '09:00',
  partnerAnswered: true,
  streakReminder: true,
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  pushToken: null,
  isPermissionGranted: false,
  preferences: DEFAULT_PREFERENCES,
  isLoading: false,

  requestPermission: async () => {
    // Web notifications
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        set({ isPermissionGranted: granted });
        return granted;
      } catch (err) {
        console.error('[Notifications] Permission request failed:', err);
        return false;
      }
    }
    
    // For native, we'd use expo-notifications but it's not installed yet
    // Return false for now - native push requires app store deployment
    console.log('[Notifications] Native push not configured yet');
    return false;
  },

  registerForPushNotifications: async (userId) => {
    set({ isLoading: true });
    
    try {
      const granted = await get().requestPermission();
      
      if (!granted) {
        console.log('[Notifications] Permission not granted');
        set({ isLoading: false });
        return null;
      }

      // Generate a simple token for web
      let token: string | null = null;
      
      if (Platform.OS === 'web') {
        // Web uses browser notifications - generate a simple identifier
        token = `web-${userId}-${Date.now()}`;
      }

      console.log('[Notifications] Token:', token);

      // Save token to database
      const supabase = getSupabase();
      if (supabase && userId && token) {
        const { error } = await supabase
          .from(TABLES.users)
          .update({ push_token: token })
          .eq('id', userId);
          
        if (error) {
          console.error('[Notifications] Failed to save token:', error);
        }
      }

      set({ pushToken: token, isLoading: false });
      return token;
    } catch (error) {
      console.error('[Notifications] Registration error:', error);
      set({ isLoading: false });
      return null;
    }
  },

  loadPreferences: async (userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;

    try {
      const { data, error } = await supabase
        .from(TABLES.users)
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        set({ preferences: { ...DEFAULT_PREFERENCES, ...data.notification_preferences } });
      }
    } catch (error) {
      console.error('[Notifications] Failed to load preferences:', error);
    }
  },

  updatePreferences: async (prefs) => {
    const currentPrefs = get().preferences;
    const newPrefs = { ...currentPrefs, ...prefs };
    
    set({ preferences: newPrefs });
    console.log('[Notifications] Preferences updated:', newPrefs);
  },

  reset: () => {
    set({
      pushToken: null,
      isPermissionGranted: false,
      preferences: DEFAULT_PREFERENCES,
      isLoading: false,
    });
  },
}));

// Helper to show a browser notification
export function showBrowserNotification(title: string, body: string, options?: NotificationOptions) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      ...options,
    });
  }
}
