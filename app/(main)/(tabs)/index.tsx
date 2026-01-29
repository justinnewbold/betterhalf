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
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function Home() {
  const { user } = useAuthStore();
  const { couple, partnerProfile, stats, streak: streakData } = useCoupleStore();
  const { initializePresence, updateMyState, isConnected } = usePresenceStore();
  const { registerForPushNotifications, isPermissionGranted } = useNotificationStore();

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
  const partnerName = partnerProfile?.display_name || 'Partner';
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.names}>
              {userName} & {partnerName}
            </Text>
            {couple?.status === 'active' && (
              <View style={styles.partnerStatusRow}>
                <PartnerStatus partnerName={partnerName} size="small" />
              </View>
            )}
          </View>
          <LinearGradient
            colors={['rgba(255,107,107,0.2)', 'rgba(192,132,252,0.2)']}
            style={styles.streakBadge}
          >
            <Text style={styles.streakText}>🔥 {streak} days</Text>
          </LinearGradient>
        </View>

        {/* Partner Answering Indicator */}
        <PartnerAnsweringIndicator partnerName={partnerName} />

        {/* Sync Score Ring */}
        <View style={styles.ringContainer}>
          <SyncScoreRing percentage={syncScore} size="medium" showLabel />
          <Text style={styles.syncLabel}>SYNC SCORE</Text>
        </View>

        {/* Daily Sync Card */}
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>TODAY'S SYNC</Text>
          <Text style={styles.cardTitle}>Ready to play today's question?</Text>
          <Text style={styles.cardDescription}>
            Answer the same question as your partner and see if you're in sync!
          </Text>
          <Button title="Play Daily Sync" onPress={handleDailySync} fullWidth size="small" />
        </Card>

        {/* Date Night Card */}
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>DATE NIGHT</Text>
          <Text style={styles.cardTitle}>10 questions, deeper connection</Text>
          <Text style={styles.cardDescription}>
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
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.total_games || 0}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.total_matches || 0}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats?.total_questions 
                ? Math.round((stats.total_matches / stats.total_questions) * 100) 
                : 0}%
            </Text>
            <Text style={styles.statLabel}>Match Rate</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
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
    color: colors.textMuted,
  },
  names: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 20,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  syncLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  cardLabel: {
    ...typography.captionBold,
    color: colors.textMuted,
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.cardDark,
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
    color: colors.purpleLight,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 12,
  },
});
