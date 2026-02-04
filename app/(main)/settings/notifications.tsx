import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../constants/ThemeContext';
import { useAuthStore } from '../../../stores/authStore';
import { hapticLight, hapticSuccess } from '../../../lib/haptics';
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  saveNotificationSettings,
  registerForPushNotificationsAsync,
  savePushToken,
} from '../../../lib/notificationService';

interface SettingRowProps {
  icon: string;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function SettingRow({ icon, title, description, value, onValueChange, disabled }: SettingRowProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingIcon}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => {
          hapticLight();
          onValueChange(newValue);
        }}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
        disabled={disabled}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const savedSettings = await loadNotificationSettings(user.id);
    setSettings(savedSettings);
    
    // Check if push notifications are enabled
    const token = await registerForPushNotificationsAsync();
    setPushEnabled(!!token);
    
    setLoading(false);
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (!user?.id) return;
    
    setSaving(true);
    const success = await saveNotificationSettings(user.id, newSettings);
    setSaving(false);
    
    if (success) {
      hapticSuccess();
    }
  };

  const enablePushNotifications = async () => {
    hapticLight();
    const token = await registerForPushNotificationsAsync();
    
    if (token && user?.id) {
      await savePushToken(user.id, token);
      setPushEnabled(true);
      hapticSuccess();
      Alert.alert('Success!', 'Push notifications are now enabled.');
    } else {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive push notifications.',
        [{ text: 'OK' }]
      );
    }
  };

  const reminderTimes = [
    { hour: 8, minute: 0, label: '8:00 AM' },
    { hour: 12, minute: 0, label: '12:00 PM' },
    { hour: 17, minute: 0, label: '5:00 PM' },
    { hour: 19, minute: 0, label: '7:00 PM' },
    { hour: 21, minute: 0, label: '9:00 PM' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Notifications' }} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Push Notification Status */}
        {!pushEnabled && Platform.OS !== 'web' && (
          <TouchableOpacity onPress={enablePushNotifications}>
            <LinearGradient
              colors={[colors.primary, '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enableBanner}
            >
              <Text style={styles.enableIcon}>🔔</Text>
              <View style={styles.enableContent}>
                <Text style={styles.enableTitle}>Enable Push Notifications</Text>
                <Text style={styles.enableDescription}>
                  Get notified when your partner answers or your streak is at risk
                </Text>
              </View>
              <Text style={styles.enableArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Daily Reminders Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DAILY REMINDERS
          </Text>
          
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon="⏰"
              title="Daily Game Reminder"
              description="Get reminded to play your daily question"
              value={settings.dailyReminder}
              onValueChange={(value) => updateSetting('dailyReminder', value)}
            />
            
            {settings.dailyReminder && (
              <View style={styles.timeSelector}>
                <Text style={[styles.timeSelectorLabel, { color: colors.textSecondary }]}>
                  Reminder Time
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {reminderTimes.map((time) => {
                    const isSelected = 
                      settings.dailyReminderTime.hour === time.hour &&
                      settings.dailyReminderTime.minute === time.minute;
                    return (
                      <TouchableOpacity
                        key={time.label}
                        style={[
                          styles.timeOption,
                          { borderColor: colors.border },
                          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => {
                          hapticLight();
                          const newSettings = {
                            ...settings,
                            dailyReminderTime: { hour: time.hour, minute: time.minute },
                          };
                          setSettings(newSettings);
                          if (user?.id) saveNotificationSettings(user.id, newSettings);
                        }}
                      >
                        <Text style={[
                          styles.timeOptionText,
                          { color: isSelected ? '#fff' : colors.text },
                        ]}>
                          {time.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Partner Activity Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PARTNER ACTIVITY
          </Text>
          
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon="💕"
              title="Partner Answered"
              description="Know when your partner completes their answer"
              value={settings.partnerActivity}
              onValueChange={(value) => updateSetting('partnerActivity', value)}
            />
            
            <SettingRow
              icon="🔥"
              title="Streak Warnings"
              description="Get warned before your streak expires"
              value={settings.streakWarnings}
              onValueChange={(value) => updateSetting('streakWarnings', value)}
            />
          </View>
        </View>

        {/* Achievements & Progress Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ACHIEVEMENTS & PROGRESS
          </Text>
          
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon="🏆"
              title="Achievement Unlocked"
              description="Celebrate when you unlock new achievements"
              value={settings.achievements}
              onValueChange={(value) => updateSetting('achievements', value)}
            />
          </View>
        </View>

        {/* Friends & Social Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            FRIENDS & SOCIAL
          </Text>
          
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon="👥"
              title="Friend Requests"
              description="Get notified of new friend invitations"
              value={settings.friendRequests}
              onValueChange={(value) => updateSetting('friendRequests', value)}
            />
          </View>
        </View>

        {/* Email Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            EMAIL NOTIFICATIONS
          </Text>
          
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon="📊"
              title="Weekly Stats Summary"
              description="Receive a weekly recap of your connection"
              value={settings.weeklyStats}
              onValueChange={(value) => updateSetting('weeklyStats', value)}
            />
          </View>
        </View>

        {saving && (
          <Text style={[styles.savingText, { color: colors.textSecondary }]}>
            Saving...
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  enableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  enableIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  enableContent: {
    flex: 1,
  },
  enableTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  enableDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  enableArrow: {
    color: '#fff',
    fontSize: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,157,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  timeSelector: {
    padding: 16,
    paddingTop: 8,
  },
  timeSelectorLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  savingText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});
