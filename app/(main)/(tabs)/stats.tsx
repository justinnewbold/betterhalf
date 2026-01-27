import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SyncScoreRing } from '../../../components/game/SyncScoreRing';
import { Card } from '../../../components/ui/Card';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

interface CategoryBarProps {
  emoji: string;
  name: string;
  percentage: number;
}

function CategoryBar({ emoji, name, percentage }: CategoryBarProps) {
  return (
    <View style={styles.categoryRow}>
      <Text style={styles.categoryEmoji}>{emoji}</Text>
      <Text style={styles.categoryName}>{name}</Text>
      <View style={styles.categoryBar}>
        <View style={[styles.categoryFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.categoryPct}>{percentage}%</Text>
    </View>
  );
}

export default function Stats() {
  // Mock data
  const overallSync = 70;
  const categories = [
    { emoji: '☀️', name: 'Daily Life', percentage: 78 },
    { emoji: '❤️', name: 'Heart', percentage: 65 },
    { emoji: '📸', name: 'History', percentage: 82 },
    { emoji: '🔥', name: 'Spice', percentage: 58 },
    { emoji: '🎉', name: 'Fun', percentage: 71 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Sync Score</Text>

        <View style={styles.ringContainer}>
          <SyncScoreRing percentage={overallSync} size="large" />
          <Text style={styles.overallLabel}>OVERALL</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardLabel}>BY CATEGORY</Text>
          {categories.map((cat) => (
            <CategoryBar key={cat.name} {...cat} />
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardLabel}>STATS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>43</Text>
              <Text style={styles.statLabel}>Questions Answered</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>31</Text>
              <Text style={styles.statLabel}>Perfect Matches</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>14</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
          </View>
        </Card>

        <Card variant="gradient" style={styles.card}>
          <Text style={styles.tipTitle}>💡 Tip</Text>
          <Text style={styles.tipText}>
            Your History category is your strongest! Consider exploring more Spice questions to improve that score.
          </Text>
        </Card>
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
    marginBottom: 24,
    marginTop: 8,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  overallLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 12,
  },
  card: {
    marginBottom: 16,
  },
  cardLabel: {
    ...typography.captionBold,
    color: colors.textMuted,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  categoryName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    width: 80,
  },
  categoryBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    backgroundColor: colors.purpleLight,
    borderRadius: 4,
  },
  categoryPct: {
    ...typography.captionBold,
    color: colors.textSecondary,
    width: 36,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 28,
    color: colors.purpleLight,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tipTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  tipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
