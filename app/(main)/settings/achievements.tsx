import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Card } from '../../../components/ui/Card';
import { useThemeStore } from '../../../stores/themeStore';
import { getThemeColors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';
import { useCoupleStore } from '../../../stores/coupleStore';
import { useAchievementStore } from '../../../stores/achievementStore';
import { useAuthStore } from '../../../stores/authStore';
import type { Tables } from '../../../lib/supabase';

type Achievement = Tables['achievements'];

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const { stats, streak } = useCoupleStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  const { 
    achievements, 
    fetchAchievements, 
    isUnlocked, 
    getProgress,
    isLoading,
    hasFetched,
  } = useAchievementStore();
  
  const currentStreak = streak?.current_streak || 0;
  const totalGames = stats?.total_games || 0;
  const totalMatches = stats?.total_matches || 0;
  
  const currentStats = useMemo(() => ({
    currentStreak,
    totalGames,
    totalMatches,
  }), [currentStreak, totalGames, totalMatches]);

  useEffect(() => {
    if (user?.id && !hasFetched) {
      fetchAchievements(user.id);
    }
  }, [user?.id, hasFetched]);

  const handleRefresh = () => {
    if (user?.id) {
      // Reset hasFetched to allow refetch
      useAchievementStore.setState({ hasFetched: false });
      fetchAchievements(user.id);
    }
  };

  const streakAchievements = achievements.filter(a => a.requirement_type === 'streak');
  const gameAchievements = achievements.filter(a => a.requirement_type === 'games');
  const matchAchievements = achievements.filter(a => a.requirement_type === 'matches');
  const specialAchievements = achievements.filter(a => a.requirement_type === 'special');
  
  const unlockedCount = achievements.filter(a => isUnlocked(a.id)).length;

  const renderAchievement = (achievement: Achievement) => {
    const unlocked = isUnlocked(achievement.id);
    const progress = getProgress(achievement, currentStats);
    
    let currentValue = 0;
    switch (achievement.requirement_type) {
      case 'streak': currentValue = currentStreak; break;
      case 'games': currentValue = totalGames; break;
      case 'matches': currentValue = totalMatches; break;
      case 'special': currentValue = progress >= 1 ? 1 : 0; break;
    }
    
    return (
      <View 
        key={achievement.id} 
        style={[
          styles.achievementItem, 
          !unlocked && styles.locked,
        ]}
      >
        <View style={[
          styles.iconContainer, 
          unlocked && { backgroundColor: themeColors.coral + '20' },
          !unlocked && { backgroundColor: themeColors.cardBackground },
        ]}>
          <Text style={styles.icon}>{achievement.icon || '🏆'}</Text>
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[
            styles.achievementTitle, 
            { color: unlocked ? themeColors.textPrimary : themeColors.textPrimaryMuted },
          ]}>
            {achievement.name}
          </Text>
          <Text style={[
            styles.achievementDesc, 
            { color: unlocked ? themeColors.textPrimarySecondary : themeColors.textPrimaryMuted },
          ]}>
            {achievement.description}
          </Text>
          {!unlocked && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: themeColors.cardBackground }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(progress * 100, 100)}%`,
                      backgroundColor: themeColors.coral,
                    },
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: themeColors.textPrimaryMuted }]}>
                {Math.min(currentValue, achievement.requirement_value)}/{achievement.requirement_value}
              </Text>
            </View>
          )}
        </View>
        {unlocked && (
          <Text style={[styles.checkmark, { color: themeColors.success }]}>✓</Text>
        )}
      </View>
    );
  };

  const renderSection = (title: string, items: Achievement[]) => {
    if (items.length === 0) return null;
    return (
      <>
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>{title}</Text>
        <Card style={styles.achievementsCard}>
          {items.map(renderAchievement)}
        </Card>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ 
        title: 'Achievements', 
        headerShown: true,
        headerStyle: { backgroundColor: themeColors.background },
        headerTintColor: themeColors.textPrimary,
      }} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: themeColors.textPrimary }]}>🏆 Your Progress</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryNumber, { color: themeColors.coral }]}>
                {unlockedCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: themeColors.textPrimarySecondary }]}>
                Unlocked
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: themeColors.cardBorder }]} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryNumber, { color: themeColors.textPrimaryMuted }]}>
                {achievements.length - unlockedCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: themeColors.textPrimarySecondary }]}>
                Remaining
              </Text>
            </View>
          </View>
          
          {/* Current Stats Mini Display */}
          <View style={[styles.miniStats, { borderTopColor: themeColors.cardBorder }]}>
            <View style={styles.miniStat}>
              <Text style={styles.miniIcon}>🔥</Text>
              <Text style={[styles.miniValue, { color: themeColors.textPrimary }]}>{currentStreak}</Text>
              <Text style={[styles.miniLabel, { color: themeColors.textPrimaryMuted }]}>Streak</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniIcon}>🎮</Text>
              <Text style={[styles.miniValue, { color: themeColors.textPrimary }]}>{totalGames}</Text>
              <Text style={[styles.miniLabel, { color: themeColors.textPrimaryMuted }]}>Games</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniIcon}>💕</Text>
              <Text style={[styles.miniValue, { color: themeColors.textPrimary }]}>{totalMatches}</Text>
              <Text style={[styles.miniLabel, { color: themeColors.textPrimaryMuted }]}>Matches</Text>
            </View>
          </View>
        </Card>
        
        {renderSection('🔥 Streak Achievements', streakAchievements)}
        {renderSection('🎮 Games Played', gameAchievements)}
        {renderSection('💕 Matches', matchAchievements)}
        {renderSection('⭐ Special', specialAchievements)}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 20,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStat: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  summaryNumber: {
    fontSize: 36,
    fontFamily: fontFamilies.bodyBold,
  },
  summaryLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  miniValue: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
  },
  miniLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    marginBottom: 12,
    marginTop: 8,
  },
  achievementsCard: {
    padding: 8,
    marginBottom: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  locked: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
  achievementDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    minWidth: 50,
    textAlign: 'right',
  },
  checkmark: {
    fontSize: 20,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
