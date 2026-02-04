import { Platform } from 'react-native';
import { getSupabase, TABLES } from './supabase';

// Notification types for the app
export type NotificationType = 
  | 'partner_answered'       // Partner finished their answer
  | 'daily_reminder'         // Daily game reminder
  | 'streak_warning'         // Streak about to expire
  | 'streak_lost'            // Streak was lost
  | 'achievement_unlocked'   // New achievement
  | 'friend_request'         // New friend request
  | 'friend_game_ready'      // Friend sent a game
  | 'weekly_stats'           // Weekly stats summary
  | 'monthly_recap';         // Monthly relationship recap

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Conditionally import expo-notifications only on native
let Notifications: any = null;
let Device: any = null;
let Constants: any = null;

// Dynamic imports for native-only modules
async function loadNativeModules() {
  if (Platform.OS !== 'web') {
    try {
      Notifications = await import('expo-notifications');
      Device = await import('expo-device');
      Constants = await import('expo-constants');
      
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (e) {
      console.log('[Notifications] Native modules not available');
    }
  }
}

// Initialize on import
loadNativeModules();

// Register for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web push not implemented');
    return null;
  }

  // Ensure modules are loaded
  await loadNativeModules();
  if (!Notifications || !Device) {
    console.log('[Notifications] Native modules not available');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device for push notifications');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || 'betterhalf',
    });
    console.log('[Notifications] Push token:', tokenResult.data);
    return tokenResult.data;
  } catch (error) {
    console.error('[Notifications] Failed to get push token:', error);
    return null;
  }
}

// Save push token to user profile
export async function savePushToken(userId: string, token: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from(TABLES.users)
      .update({ 
        push_token: token,
        push_token_updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    console.log('[Notifications] Push token saved');
  } catch (error) {
    console.error('[Notifications] Failed to save push token:', error);
  }
}

// Schedule local notification (native only)
export async function scheduleLocalNotification(
  notification: NotificationPayload,
  trigger?: any
): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications) {
    console.log('[Notifications] Local notifications not available on web');
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { type: notification.type, ...notification.data },
        sound: true,
      },
      trigger: trigger || null,
    });
    return notificationId;
  } catch (error) {
    console.error('[Notifications] Failed to schedule notification:', error);
    return null;
  }
}

// Schedule daily reminder (native only)
export async function scheduleDailyReminder(hour: number = 19, minute: number = 0): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications) {
    return null;
  }

  // Cancel existing daily reminders
  await cancelScheduledNotifications('daily_reminder');

  return scheduleLocalNotification(
    {
      type: 'daily_reminder',
      title: "Time to connect! 💕",
      body: "Your daily question is waiting. Take a moment to strengthen your bond!",
    },
    {
      hour,
      minute,
      repeats: true,
    }
  );
}

// Cancel scheduled notifications by type
export async function cancelScheduledNotifications(type?: NotificationType): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (!type || notification.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Store notification for delivery via database
export async function queueNotification(
  userId: string,
  notification: NotificationPayload
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    await supabase
      .from('betterhalf_notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to queue notification:', error);
    return false;
  }
}

// Get notification settings
export interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: { hour: number; minute: number };
  partnerActivity: boolean;
  streakWarnings: boolean;
  achievements: boolean;
  friendRequests: boolean;
  weeklyStats: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  dailyReminder: true,
  dailyReminderTime: { hour: 19, minute: 0 },
  partnerActivity: true,
  streakWarnings: true,
  achievements: true,
  friendRequests: true,
  weeklyStats: true,
};

// Load notification settings from user preferences
export async function loadNotificationSettings(userId: string): Promise<NotificationSettings> {
  const supabase = getSupabase();
  if (!supabase) return DEFAULT_NOTIFICATION_SETTINGS;

  try {
    const { data } = await supabase
      .from(TABLES.users)
      .select('notification_settings')
      .eq('id', userId)
      .single();

    return data?.notification_settings || DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

// Save notification settings
export async function saveNotificationSettings(
  userId: string,
  settings: NotificationSettings
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    await supabase
      .from(TABLES.users)
      .update({ notification_settings: settings })
      .eq('id', userId);

    // Update scheduled notifications based on settings (native only)
    if (Platform.OS !== 'web') {
      if (settings.dailyReminder) {
        await scheduleDailyReminder(
          settings.dailyReminderTime.hour,
          settings.dailyReminderTime.minute
        );
      } else {
        await cancelScheduledNotifications('daily_reminder');
      }
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Failed to save settings:', error);
    return false;
  }
}
