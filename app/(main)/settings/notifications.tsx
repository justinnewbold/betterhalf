import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../stores/authStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import { colors } from '../../../constants/colors';
import { typography } from '../../../constants/typography';

export default function NotificationSettings() {
  const { user } = useAuthStore();
  const { 
    pushToken, 
    isPermissionGranted, 
    preferences, 
    isLoading,
    registerForPushNotifications,
    updatePreferences,
    loadPreferences,
  } = useNotificationStore();

  const [localPrefs, setLocalPrefs] = useState(preferences);

  useEffect(() => {
    if (user?.id) {
      loadPreferences(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleEnableNotifications = async () => {
    if (!user?.id) return;
    
    const token = await registerForPushNotifications(user.id);
    if (token) {
      Alert.alert('Success', 'Notifications enabled! You\'ll be notified when your partner answers.');
    } else {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive alerts.',
        [{ text: 'OK' }]
      );
    }
  };

  const togglePreference = async (key: keyof typeof localPrefs) => {
    if (typeof localPrefs[key] === 'boolean') {
      const newValue = !localPrefs[key];
      setLocalPrefs(prev => ({ ...prev, [key]: newValue }));
      await updatePreferences({ [key]: newValue });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* Enable Notifications Card */}
        {!isPermissionGranted && (
          <LinearGradient
            colors={['rgba(244,114,182,0.1)', 'rgba(192,132,252,0.1)']}
            style={styles.enableCard}
          >
            <Text style={styles.enableTitle}>🔔 Enable Notifications</Text>
            <Text style={styles.enableDescription}>
              Get notified when your partner answers the daily question, and never miss your streak!
            </Text>
            <TouchableOpacity 
              style={styles.enableButton}
              onPress={handleEnableNotifications}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.enableButtonGradient}
              >
                <Text style={styles.enableButtonText}>
                  {isLoading ? 'Enabling...' : 'Enable Notifications'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Daily Reminder</Text>
              <Text style={styles.settingDescription}>
                Remind me to answer the daily question
              </Text>
            </View>
            <Switch
              value={localPrefs.dailyReminder}
              onValueChange={() => togglePreference('dailyReminder')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={localPrefs.dailyReminder ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Partner Answered</Text>
              <Text style={styles.settingDescription}>
                Notify me when my partner answers
              </Text>
            </View>
            <Switch
              value={localPrefs.partnerAnswered}
              onValueChange={() => togglePreference('partnerAnswered')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={localPrefs.partnerAnswered ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Streak Reminder</Text>
              <Text style={styles.settingDescription}>
                Remind me before I lose my streak
              </Text>
            </View>
            <Switch
              value={localPrefs.streakReminder}
              onValueChange={() => togglePreference('streakReminder')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={localPrefs.streakReminder ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Status */}
        {isPermissionGranted && (
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>
              ✓ Notifications are enabled
            </Text>
            {Platform.OS === 'web' && (
              <Text style={styles.statusNote}>
                Browser notifications will appear when your partner answers.
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 60,
  },
  backText: {
    ...typography.body,
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  enableCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  enableTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 8,
  },
  enableDescription: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 22,
  },
  enableButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  enableButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  enableButtonText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusSection: {
    padding: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 12,
  },
  statusText: {
    ...typography.body,
    color: '#4ADE80',
    fontWeight: '500',
  },
  statusNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
});
