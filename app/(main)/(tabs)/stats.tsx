import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SyncScoreRing } from '../../../components/game/SyncScoreRing';
import { Card } from '../../../components/ui/Card';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { useThemeStore } from '../../../stores/themeStore';
import { getSupabase, TABLES } from '../../../lib/supabase';
import { colors, getThemeColors, ThemeColors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

interface CategoryBarProps {
  emoji: string;
  name: string;
  percentage: number;
  themeColors: ThemeColors;
  isDark: boolean;
}

interface CategoryStats {
  category: string;
  total: number;
  matches: number;
}

function CategoryBar({ emoji, name, percentage, themeColors, isDark }: CategoryBarProps) {
  return (
    <View style={styles.categoryRow}>
      <Text style={styles.categoryEmoji}>{emoji}</Text>
      <Text style={[styles.categoryName, { color: themeColors.textPrimary }]}>{name}</Text>
      <View style={[styles.categoryBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        <View style={[styles.categoryFill, { width: `${percentage}%`, backgroundColor: themeColors.purpleLight }]} />
      </View>
      <Text style={[styles.categoryPct, { color: themeColors.textSecondary }]}>{percentage}%</Text>
    </View>
  );
}

const CATEGORY_CONFIG: Record<string, { emoji: string; name: string }> = {
  daily_life: { emoji: '☀️', name: 'Daily Life' },
  heart: { emoji: '❤️', name: 'Heart' },
  history: { emoji: '📸', name: 'History' },
  spice: { emoji: '🔥', name: 'Spice' },
  fun: { emoji: '🎉', name: 'Fun' },
};

export default function Stats() {
  const { user } = useAuthStore();
  const { couple, stats, streak } = useCoupleStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: themeColors.background,
    },
    title: {
      color: themeColors.textPrimary,
    },
    overallLabel: {
      color: themeColors.textMuted,
    },
    cardLabel: {
      color: themeColors.textMuted,
    },
    emptyTitle: {
      color: themeColors.textPrimary,
    },
    emptyText: {
      color: themeColors.textMuted,
    },
    statBox: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
    statNumber: {
      color: themeColors.purpleLight,
    },
    statLabel: {
      color: themeColors.textMuted,
    },
    tipTitle: {
      color: themeColors.textPrimary,
    },
    tipText: {
      color: themeColors.textSecondary,
    },
  };

  useEffect(() => {
    loadCategoryStats();
  }, [couple?.id]);

  const loadCategoryStats = async () => {
    const supabase = getSupabase();
    if (!supabase || !couple?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Get all completed daily sessions for this couple
      const { data: sessions, error } = await supabase
        .from('betterhalf_daily_sessions')
        .select('question_id, is_match, question:betterhalf_questions(category)')
        .eq('couple_id', couple.id)
        .not('completed_at', 'is', null);

      if (error) throw error;

      // Calculate stats per category
      const categoryMap: Record<string, { total: number; matches: number }> = {};
      
      sessions?.forEach((session: any) => {
        const category = session.question?.category || 'unknown';
        if (!categoryMap[category]) {
          categoryMap[category] = { total: 0, matches: 0 };
        }
        categoryMap[category].total++;
        if (session.is_match) {
          categoryMap[category].matches++;
        }
      });

      const statsArray = Object.entries(categoryMap).map(([category, data]) => ({
        category,
        total: data.total,
        matches: data.matches,
      }));

      setCategoryStats(statsArray);
    } catch (err) {
      console.error('[Stats] Load category stats error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Use real data with fallbacks
  const overallSync = stats?.sync_score || 0;
  const totalGames = stats?.total_games || 0;
  const totalMatches = stats?.total_matches || 0;
  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;

  // Build category display data
  const categoryDisplay = Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
    const catStat = categoryStats.find(c => c.category === key);
    const percentage = catStat && catStat.total > 0
      ? Math.round((catStat.matches / catStat.total) * 100)
      : 0;
    return {
      ...config,
      percentage,
      hasData: catStat ? catStat.total > 0 : false,
    };
  });

  // Find strongest/weakest category for tip
  const categoriesWithData = categoryDisplay.filter(c => c.hasData);
  const strongest = categoriesWithData.length > 0
    ? categoriesWithData.reduce((a, b) => a.percentage > b.percentage ? a : b)
    : null;
  const weakest = categoriesWithData.length > 0
    ? categoriesWithData.reduce((a, b) => a.percentage < b.percentage ? a : b)
    : null;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.title, dynamicStyles.title]}>Your Sync Score</Text>

        <View style={styles.ringContainer}>
          <SyncScoreRing percentage={overallSync} size="large" />
          <Text style={[styles.overallLabel, dynamicStyles.overallLabel]}>OVERALL</Text>
        </View>

        {totalGames === 0 ? (
          <Card style={styles.card}>
            <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No games played yet!</Text>
            <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
              Play your first Daily Sync to start tracking your stats.
            </Text>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <Text style={[styles.cardLabel, dynamicStyles.cardLabel]}>BY CATEGORY</Text>
              {categoryDisplay.map((cat) => (
                <CategoryBar 
                  key={cat.name} 
                  emoji={cat.emoji}
                  name={cat.name}
                  percentage={cat.percentage}
                  themeColors={themeColors}
                  isDark={isDark}
                />
              ))}
            </Card>

            <Card style={styles.card}>
              <Text style={[styles.cardLabel, dynamicStyles.cardLabel]}>STATS</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, dynamicStyles.statBox]}>
                  <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{stats?.total_questions || 0}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Questions Answered</Text>
                </View>
                <View style={[styles.statBox, dynamicStyles.statBox]}>
                  <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{totalMatches}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Perfect Matches</Text>
                </View>
                <View style={[styles.statBox, dynamicStyles.statBox]}>
                  <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{currentStreak}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Current Streak</Text>
                </View>
                <View style={[styles.statBox, dynamicStyles.statBox]}>
                  <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{longestStreak}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Longest Streak</Text>
                </View>
              </View>
            </Card>

            {strongest && weakest && strongest.name !== weakest.name && (
              <Card variant="gradient" style={styles.card}>
                <Text style={[styles.tipTitle, dynamicStyles.tipTitle]}>💡 Tip</Text>
                <Text style={[styles.tipText, dynamicStyles.tipText]}>
                  Your {strongest.name} category is your strongest at {strongest.percentage}%! 
                  Consider exploring more {weakest.name} questions to improve that score.
                </Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 24,
    marginTop: 8,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  overallLabel: {
    ...typography.caption,
    marginTop: 12,
  },
  card: {
    marginBottom: 16,
  },
  cardLabel: {
    ...typography.captionBold,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
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
    width: 80,
  },
  categoryBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPct: {
    ...typography.captionBold,
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 28,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  tipTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    marginBottom: 6,
  },
  tipText: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
});
