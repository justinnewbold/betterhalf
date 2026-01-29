import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { getSupabase, TABLES } from '../lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
  scheduleLocalNotification: (title: string, body: string, trigger?: any) => Promise<string | null>;
  cancelAllNotifications: () => Promise<void>;
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

  registerForPushNotifications: async (userId) => {
    set({ isLoading: true });
    
    try {
      // Check if physical device (required for push)
      if (Platform.OS !== 'web' && !Device.isDevice) {
        console.log('[Notifications] Must use physical device for push notifications');
        set({ isLoading: false });
        return null;
      }

      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted');
        set({ isPermissionGranted: false, isLoading: false });
        return null;
      }

      set({ isPermissionGranted: true });

      // Get push token
      let token: string | null = null;
      
      if (Platform.OS === 'web') {
        // Web uses browser notifications - no Expo token needed
        console.log('[Notifications] Web platform - using browser notifications');
        token = 'web-' + userId;
      } else {
        // Native platforms use Expo Push
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'betterhalf',
        });
        token = tokenData.data;
      }

      console.log('[Notifications] Push token:', token);

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
    const supabase = getSupabase();
    const currentPrefs = get().preferences;
    const newPrefs = { ...currentPrefs, ...prefs };
    
    set({ preferences: newPrefs });

    // Save to database if connected
    // This would require the userId - for now just update local state
    console.log('[Notifications] Preferences updated:', newPrefs);
  },

  scheduleLocalNotification: async (title, body, trigger) => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: trigger || null, // null = immediate
      });
      
      console.log('[Notifications] Scheduled notification:', id);
      return id;
    } catch (error) {
      console.error('[Notifications] Failed to schedule:', error);
      return null;
    }
  },

  cancelAllNotifications: async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[Notifications] Cancelled all notifications');
    } catch (error) {
      console.error('[Notifications] Failed to cancel:', error);
    }
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

// Helper to send notification when partner answers
export async function notifyPartnerAnswered(partnerId: string, partnerName: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // Get partner's push token
    const { data, error } = await supabase
      .from(TABLES.users)
      .select('push_token, notification_preferences')
      .eq('id', partnerId)
      .single();

    if (error || !data?.push_token) return;

    // Check if they have this notification enabled
    const prefs = data.notification_preferences || DEFAULT_PREFERENCES;
    if (!prefs.partnerAnswered) return;

    // For Expo push, we'd send to their token here
    // This would typically be done server-side via Supabase Edge Function
    console.log('[Notifications] Would notify partner:', partnerId);
  } catch (error) {
    console.error('[Notifications] Failed to notify partner:', error);
  }
}
