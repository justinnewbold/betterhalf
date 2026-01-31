import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SyncScoreRing } from '../../../components/game/SyncScoreRing';
import { PartnerStatus, PartnerAnsweringIndicator } from '../../../components/ui/PartnerStatus';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { usePresenceStore } from '../../../stores/presenceStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useThemeStore } from '../../../stores/themeStore';
import { colors, getThemeColors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function Home() {
  const { user } = useAuthStore();
  const { couple, partnerProfile, stats, streak: streakData } = useCoupleStore();
  const { initializePresence, updateMyState, isConnected } = usePresenceStore();
  const { registerForPushNotifications, isPermissionGranted } = useNotificationStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

  // Auto-register for notifications (one-time check)
  useEffect(() => {
    if (user?.id && couple?.status === 'active' && !isPermissionGranted) {
      // Silently attempt to register - don't block or prompt
      registerForPushNotifications(user.id).catch(() => {});
    }
  }, [user?.id, couple?.status]);

  // Initialize presence when we have couple data
  useEffect(() => {
    if (user?.id && couple?.id && couple.status === 'active') {
      const displayName = user.display_name || 'User';
      initializePresence(user.id, couple.id, displayName);
    }
  }, [user?.id, couple?.id, couple?.status]);

  // Update presence state when returning to home
  useEffect(() => {
    if (isConnected) {
      updateMyState('online', 'home');
    }
  }, [isConnected]);

  // Use real data where available, fallback to defaults
  const syncScore = stats?.sync_score || 0;
  const streak = streakData?.current_streak || 0;
  const connectionName = partnerProfile?.display_name || 'Your Person';
  const userName = user?.display_name || 'You';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleDailySync = () => {
    router.push('/(main)/game/daily');
  };

  const handleDateNight = () => {
    router.push('/(main)/game/datenight');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: themeColors.textMuted }]}>{getGreeting()}</Text>
            <Text style={[styles.names, { color: themeColors.textPrimary }]}>
              {userName} & {connectionName}
            </Text>
            {couple?.status === 'active' && (
              <View style={styles.partnerStatusRow}>
                <PartnerStatus partnerName={connectionName} size="small" />
              </View>
            )}
          </View>
          <LinearGradient
            colors={isDark 
              ? ['rgba(255,107,107,0.2)', 'rgba(192,132,252,0.2)']
              : ['rgba(232,85,85,0.15)', 'rgba(168,85,247,0.15)']
            }
            style={styles.streakBadge}
          >
            <Text style={[styles.streakText, { color: themeColors.textPrimary }]}>🔥 {streak} days</Text>
          </LinearGradient>
        </View>

        {/* Partner Answering Indicator */}
        <PartnerAnsweringIndicator partnerName={connectionName} />

        {/* Sync Score Ring */}
        <View style={styles.ringContainer}>
          <SyncScoreRing percentage={syncScore} size="medium" showLabel />
          <Text style={[styles.syncLabel, { color: themeColors.textMuted }]}>SYNC SCORE</Text>
        </View>

        {/* Daily Sync Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardLabel, { color: themeColors.textMuted }]}>TODAY'S SYNC</Text>
          <Text style={[styles.cardTitle, { color: themeColors.textPrimary }]}>Ready to play today's question?</Text>
          <Text style={[styles.cardDescription, { color: themeColors.textSecondary }]}>
            Answer the same question as your person and see if you're in sync!
          </Text>
          <Button title="Play Daily Sync" onPress={handleDailySync} fullWidth size="small" />
        </Card>

        {/* Date Night Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardLabel, { color: themeColors.textMuted }]}>DATE NIGHT</Text>
          <Text style={[styles.cardTitle, { color: themeColors.textPrimary }]}>10 questions, deeper connection</Text>
          <Text style={[styles.cardDescription, { color: themeColors.textSecondary }]}>
            Perfect for a cozy evening together. Discover new things about each other.
          </Text>
          <Button
            title="Start Date Night"
            onPress={handleDateNight}
            variant="secondary"
            fullWidth
            size="small"
          />
        </Card>

        {/* Quick Stats */}
        <View style={[styles.quickStats, { backgroundColor: themeColors.cardBackground }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.purpleLight }]}>{stats?.total_games || 0}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Games Played</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: themeColors.cardBorder }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.purpleLight }]}>{stats?.total_matches || 0}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Matches</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: themeColors.cardBorder }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.purpleLight }]}>
              {stats?.total_questions 
                ? Math.round((stats.total_matches / stats.total_questions) * 100) 
                : 0}%
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Match Rate</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  greeting: {
    ...typography.bodySmall,
  },
  names: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 20,
  },
  partnerStatusRow: {
    marginTop: 4,
  },
  streakBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  streakText: {
    ...typography.label,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  syncLabel: {
    ...typography.caption,
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  cardLabel: {
    ...typography.captionBold,
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    marginBottom: 6,
  },
  cardDescription: {
    ...typography.bodySmall,
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 12,
  },
});