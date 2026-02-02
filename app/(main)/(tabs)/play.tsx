import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, getThemeColors, ThemeColors } from '../../../constants/colors';
import { useThemeStore } from '../../../stores/themeStore';
import { typography, fontFamilies } from '../../../constants/typography';

interface GameModeCardProps {
  emoji: string;
  title: string;
  description: string;
  duration: string;
  onPress: () => void;
  isPrimary?: boolean;
  isLocked?: boolean;
  themeColors: ThemeColors;
  isDark: boolean;
}

function GameModeCard({ emoji, title, description, duration, onPress, isPrimary, isLocked, themeColors, isDark }: GameModeCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.7}
      style={styles.cardTouchable}
    >
      {isPrimary ? (
        <LinearGradient
          colors={themeColors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.modeCard, styles.primaryCard]}
        >
          <Text style={styles.modeEmoji}>{emoji}</Text>
          <View style={styles.modeContent}>
            <Text style={[styles.modeTitle, { color: '#FFFFFF' }]}>{title}</Text>
            <Text style={[styles.modeDescription, { color: 'rgba(255,255,255,0.9)' }]}>{description}</Text>
            <Text style={[styles.modeDuration, { color: 'rgba(255,255,255,0.7)' }]}>{duration}</Text>
          </View>
        </LinearGradient>
      ) : (
        <View style={[
          styles.modeCard, 
          { 
            backgroundColor: themeColors.cardBackground, 
            borderColor: themeColors.cardBorder 
          },
          isLocked && styles.lockedCard
        ]}>
          <Text style={styles.modeEmoji}>{emoji}</Text>
          <View style={styles.modeContent}>
            <Text style={[styles.modeTitle, { color: themeColors.textPrimary }]}>
              {title} {isLocked && '🔒'}
            </Text>
            <Text style={[
              styles.modeDescription, 
              { color: isLocked ? themeColors.textMuted : themeColors.textSecondary }
            ]}>
              {description}
            </Text>
            <Text style={[styles.modeDuration, { color: themeColors.textMuted }]}>{duration}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function Play() {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>Choose Your Game</Text>
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>Pick a mode and start playing together</Text>

        <GameModeCard
          emoji="☀️"
          title="Daily Sync"
          description="One question per day. Quick and meaningful."
          duration="~1 minute"
          onPress={() => router.push('/(main)/game/daily')}
          isPrimary
          themeColors={themeColors}
          isDark={isDark}
        />

        <GameModeCard
          emoji="🌙"
          title="Date Night"
          description="10 questions across all categories. Perfect for quality time."
          duration="~15 minutes"
          onPress={() => router.push('/(main)/game/datenight')}
          themeColors={themeColors}
          isDark={isDark}
        />

        <GameModeCard
          emoji="🎉"
          title="Party Battle"
          description="Play with other couples. See who knows each other best!"
          duration="~20 minutes"
          onPress={() => {}}
          isLocked
          themeColors={themeColors}
          isDark={isDark}
        />

        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Question Categories</Text>
          <View style={styles.categories}>
            {[
              { emoji: '☀️', name: 'Daily Life', count: 25 },
              { emoji: '❤️', name: 'Heart', count: 25 },
              { emoji: '📸', name: 'History', count: 25 },
              { emoji: '🔥', name: 'Spice', count: 25 },
              { emoji: '🎉', name: 'Fun', count: 50 },
            ].map((cat) => (
              <View 
                key={cat.name} 
                style={[
                  styles.categoryBadge, 
                  { 
                    backgroundColor: themeColors.cardBackground,
                    borderWidth: 1,
                    borderColor: themeColors.cardBorder,
                  }
                ]}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryName, { color: themeColors.textPrimary }]}>{cat.name}</Text>
                <Text style={[styles.categoryCount, { color: themeColors.textMuted }]}>{cat.count}</Text>
              </View>
            ))}
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
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    ...typography.body,
    marginBottom: 24,
  },
  cardTouchable: {
    marginBottom: 16,
  },
  modeCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  primaryCard: {
    borderWidth: 0,
  },
  lockedCard: {
    opacity: 0.6,
  },
  modeEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    marginBottom: 4,
  },
  modeDescription: {
    ...typography.bodySmall,
    marginBottom: 6,
  },
  modeDuration: {
    ...typography.caption,
  },
  categoriesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    marginBottom: 16,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryBadge: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryName: {
    ...typography.bodySmall,
  },
  categoryCount: {
    ...typography.caption,
  },
});
