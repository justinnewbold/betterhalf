import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

interface GameModeCardProps {
  emoji: string;
  title: string;
  description: string;
  duration: string;
  onPress: () => void;
  isPrimary?: boolean;
  isLocked?: boolean;
}

function GameModeCard({ emoji, title, description, duration, onPress, isPrimary, isLocked }: GameModeCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.7}
      style={styles.cardTouchable}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[colors.coral, colors.purpleLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.modeCard, styles.primaryCard]}
        >
          <Text style={styles.modeEmoji}>{emoji}</Text>
          <View style={styles.modeContent}>
            <Text style={styles.modeTitle}>{title}</Text>
            <Text style={styles.modeDescription}>{description}</Text>
            <Text style={styles.modeDuration}>{duration}</Text>
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.modeCard, isLocked && styles.lockedCard]}>
          <Text style={styles.modeEmoji}>{emoji}</Text>
          <View style={styles.modeContent}>
            <Text style={styles.modeTitle}>
              {title} {isLocked && '🔒'}
            </Text>
            <Text style={[styles.modeDescription, isLocked && styles.lockedText]}>
              {description}
            </Text>
            <Text style={styles.modeDuration}>{duration}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function Play() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choose Your Game</Text>
        <Text style={styles.subtitle}>Pick a mode and start playing together</Text>

        <GameModeCard
          emoji="☀️"
          title="Daily Sync"
          description="One question per day. Quick and meaningful."
          duration="~1 minute"
          onPress={() => router.push('/(main)/game/daily')}
          isPrimary
        />

        <GameModeCard
          emoji="🌙"
          title="Date Night"
          description="10 questions across all categories. Perfect for quality time."
          duration="~15 minutes"
          onPress={() => router.push('/(main)/game/datenight')}
        />

        <GameModeCard
          emoji="🎉"
          title="Party Battle"
          description="Play with other couples. See who knows each other best!"
          duration="~20 minutes"
          onPress={() => {}}
          isLocked
        />

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Question Categories</Text>
          <View style={styles.categories}>
            {[
              { emoji: '☀️', name: 'Daily Life', count: 25 },
              { emoji: '❤️', name: 'Heart', count: 25 },
              { emoji: '📸', name: 'History', count: 25 },
              { emoji: '🔥', name: 'Spice', count: 25 },
              { emoji: '🎉', name: 'Fun', count: 50 },
            ].map((cat) => (
              <View key={cat.name} style={styles.categoryBadge}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCount}>{cat.count}</Text>
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
    backgroundColor: colors.darkBg,
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
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 24,
  },
  cardTouchable: {
    marginBottom: 16,
  },
  modeCard: {
    backgroundColor: colors.cardDark,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardDarkBorder,
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
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modeDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  lockedText: {
    color: colors.textMuted,
  },
  modeDuration: {
    ...typography.caption,
    color: colors.textMuted,
  },
  categoriesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryBadge: {
    backgroundColor: colors.cardDark,
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
    color: colors.textPrimary,
  },
  categoryCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
