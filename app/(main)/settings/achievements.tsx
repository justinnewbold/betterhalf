import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Card } from '../../../components/ui/Card';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';
import { useCoupleStore } from '../../../stores/coupleStore';

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  requirement: number;
  type: 'streak' | 'games' | 'matches' | 'special';
}

const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  { id: 'streak_3', icon: '🔥', title: 'Getting Started', description: 'Play 3 days in a row', requirement: 3, type: 'streak' },
  { id: 'streak_7', icon: '🔥', title: 'Week Warrior', description: 'Play 7 days in a row', requirement: 7, type: 'streak' },
  { id: 'streak_14', icon: '🔥', title: 'Two Week Streak', description: 'Play 14 days in a row', requirement: 14, type: 'streak' },
  { id: 'streak_30', icon: '🔥', title: 'Monthly Master', description: 'Play 30 days in a row', requirement: 30, type: 'streak' },
  { id: 'streak_100', icon: '💯', title: 'Century Club', description: 'Play 100 days in a row', requirement: 100, type: 'streak' },
  
  // Games played achievements
  { id: 'games_10', icon: '🎮', title: 'Just Getting Started', description: 'Complete 10 games', requirement: 10, type: 'games' },
  { id: 'games_50', icon: '🎮', title: 'Regular Player', description: 'Complete 50 games', requirement: 50, type: 'games' },
  { id: 'games_100', icon: '🎮', title: 'Dedicated Duo', description: 'Complete 100 games', requirement: 100, type: 'games' },
  { id: 'games_500', icon: '🎮', title: 'Power Pair', description: 'Complete 500 games', requirement: 500, type: 'games' },
  
  // Match achievements
  { id: 'matches_10', icon: '💕', title: 'In Sync', description: 'Match 10 times', requirement: 10, type: 'matches' },
  { id: 'matches_50', icon: '💕', title: 'Mind Readers', description: 'Match 50 times', requirement: 50, type: 'matches' },
  { id: 'matches_100', icon: '💕', title: 'Soulmates', description: 'Match 100 times', requirement: 100, type: 'matches' },
  
  // Special achievements
  { id: 'first_match', icon: '⭐', title: 'First Match', description: 'Get your first match', requirement: 1, type: 'special' },
  { id: 'perfect_day', icon: '✨', title: 'Perfect Day', description: 'Match on all questions in a day', requirement: 1, type: 'special' },
];

export default function AchievementsScreen() {
  const { stats, streak } = useCoupleStore();
  
  const currentStreak = streak?.current_streak || 0;
  const totalGames = stats?.total_games || 0;
  const totalMatches = stats?.total_matches || 0;
  
  const getProgress = (achievement: Achievement): number => {
    switch (achievement.type) {
      case 'streak':
        return Math.min(currentStreak / achievement.requirement, 1);
      case 'games':
        return Math.min(totalGames / achievement.requirement, 1);
      case 'matches':
        return Math.min(totalMatches / achievement.requirement, 1);
      case 'special':
        // Special achievements need specific tracking
        if (achievement.id === 'first_match') return totalMatches > 0 ? 1 : 0;
        return 0;
      default:
        return 0;
    }
  };
  
  const isUnlocked = (achievement: Achievement): boolean => {
    return getProgress(achievement) >= 1;
  };
  
  const unlockedCount = ACHIEVEMENTS.filter(isUnlocked).length;
  
  const renderAchievement = (achievement: Achievement) => {
    const unlocked = isUnlocked(achievement);
    const progress = getProgress(achievement);
    
    return (
      <View key={achievement.id} style={[styles.achievementItem, !unlocked && styles.locked]}>
        <View style={[styles.iconContainer, unlocked && styles.iconUnlocked]}>
          <Text style={styles.icon}>{achievement.icon}</Text>
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, !unlocked && styles.lockedText]}>
            {achievement.title}
          </Text>
          <Text style={[styles.achievementDesc, !unlocked && styles.lockedText]}>
            {achievement.description}
          </Text>
          {!unlocked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress * achievement.requirement)}/{achievement.requirement}
              </Text>
            </View>
          )}
        </View>
        {unlocked && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Achievements', headerShown: true }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>🏆 Your Progress</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryNumber}>{unlockedCount}</Text>
              <Text style={styles.summaryLabel}>Unlocked</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryNumber}>{ACHIEVEMENTS.length - unlockedCount}</Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
          </View>
        </Card>
        
        {/* Streak Achievements */}
        <Text style={styles.sectionTitle}>🔥 Streak Achievements</Text>
        <Card style={styles.achievementsCard}>
          {ACHIEVEMENTS.filter(a => a.type === 'streak').map(renderAchievement)}
        </Card>
        
        {/* Games Achievements */}
        <Text style={styles.sectionTitle}>🎮 Games Played</Text>
        <Card style={styles.achievementsCard}>
          {ACHIEVEMENTS.filter(a => a.type === 'games').map(renderAchievement)}
        </Card>
        
        {/* Match Achievements */}
        <Text style={styles.sectionTitle}>💕 Matches</Text>
        <Card style={styles.achievementsCard}>
          {ACHIEVEMENTS.filter(a => a.type === 'matches').map(renderAchievement)}
        </Card>
        
        {/* Special Achievements */}
        <Text style={styles.sectionTitle}>⭐ Special</Text>
        <Card style={styles.achievementsCard}>
          {ACHIEVEMENTS.filter(a => a.type === 'special').map(renderAchievement)}
        </Card>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    ...typography.h2,
    color: colors.text,
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
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconUnlocked: {
    backgroundColor: colors.primary + '20',
  },
  icon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...typography.body,
    fontFamily: fontFamilies.semiBold,
    color: colors.text,
  },
  achievementDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lockedText: {
    color: colors.textMuted,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
    minWidth: 50,
    textAlign: 'right',
  },
  checkmark: {
    fontSize: 20,
    color: colors.success,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
