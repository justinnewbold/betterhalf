import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { getSupabase, TABLES } from './supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

// Register for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'web') {
    console.log('[Notifications] Web push not implemented');
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
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || 'betterhalf',
    });
    token = tokenResult.data;
    console.log('[Notifications] Push token:', token);
  } catch (error) {
    console.error('[Notifications] Failed to get push token:', error);
    return null;
  }

  // Configure Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Better Half',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B9D',
    });

    // Create separate channels for different notification types
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('social', {
      name: 'Partner & Friends',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('achievements', {
      name: 'Achievements',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100],
    });
  }

  return token;
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

// Schedule local notification
export async function scheduleLocalNotification(
  notification: NotificationPayload,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { type: notification.type, ...notification.data },
        sound: true,
      },
      trigger: trigger || null, // null = immediate
    });
    return notificationId;
  } catch (error) {
    console.error('[Notifications] Failed to schedule notification:', error);
    return null;
  }
}

// Schedule daily reminder
export async function scheduleDailyReminder(hour: number = 19, minute: number = 0): Promise<string | null> {
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
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (!type || notification.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Send notification to partner (server-side would use Expo Push API)
// This is a client-side placeholder that shows local notification
export async function notifyPartner(
  partnerId: string,
  notification: NotificationPayload
): Promise<boolean> {
  // In production, this would call a Supabase Edge Function
  // that uses Expo Push Notification API to send to partner
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // Store notification in database for delivery
    await supabase
      .from('betterhalf_notifications')
      .insert({
        user_id: partnerId,
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

// Add notification listener
export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Add response listener (when user taps notification)
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
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

    // Update scheduled notifications based on settings
    if (settings.dailyReminder) {
      await scheduleDailyReminder(
        settings.dailyReminderTime.hour,
        settings.dailyReminderTime.minute
      );
    } else {
      await cancelScheduledNotifications('daily_reminder');
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Failed to save settings:', error);
    return false;
  }
}
