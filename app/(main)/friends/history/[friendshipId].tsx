import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../../../components/ui/Card';
import { useFriendsStore } from '../../../../stores/friendsStore';
import { useAuthStore } from '../../../../stores/authStore';
import { getSupabase, TABLES, QUESTION_CATEGORIES } from '../../../../lib/supabase';
import { colors } from '../../../../constants/colors';
import { typography, fontFamilies } from '../../../../constants/typography';

interface HistoryGame {
  id: string;
  game_date: string;
  question_number: number;
  status: string;
  initiator_answer: number | null;
  friend_answer: number | null;
  is_match: boolean | null;
  completed_at: string | null;
  question: {
    id: string;
    question: string;
    options: string[];
    category: string;
  };
}

interface GroupedHistory {
  date: string;
  displayDate: string;
  games: HistoryGame[];
  matchCount: number;
  totalCompleted: number;
}

export default function FriendGameHistoryScreen() {
  const { friendshipId } = useLocalSearchParams<{ friendshipId: string }>();
  const { user } = useAuthStore();
  const { getFriendById } = useFriendsStore();
  
  const friend = getFriendById(friendshipId || '');
  const isInitiator = friend?.user_id === user?.id;
  const friendUser = isInitiator ? friend?.friend_user : friend?.initiator_user;
  const friendName = friend?.nickname || friendUser?.display_name || 'Friend';
  
  const [history, setHistory] = useState<GroupedHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [totalStats, setTotalStats] = useState({ games: 0, matches: 0 });

  const fetchHistory = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !friendshipId) return;

    try {
      const { data, error } = await supabase
        .from(TABLES.friend_games)
        .select(`
          id,
          game_date,
          question_number,
          status,
          initiator_answer,
          friend_answer,
          is_match,
          completed_at,
          question:betterhalf_questions(id, question, options, category)
        `)
        .eq('friendship_id', friendshipId)
        .eq('status', 'completed')
        .order('game_date', { ascending: false })
        .order('question_number', { ascending: true });

      if (error) {
        console.error('[FriendHistory] Error fetching:', error);
        return;
      }

      // Group by date
      const groupedMap = new Map<string, HistoryGame[]>();
      let totalMatches = 0;
      
      (data || []).forEach((game: any) => {
        const dateKey = game.game_date;
        if (!groupedMap.has(dateKey)) {
          groupedMap.set(dateKey, []);
        }
        groupedMap.get(dateKey)!.push(game);
        if (game.is_match) totalMatches++;
      });

      // Convert to array with display dates
      const grouped: GroupedHistory[] = Array.from(groupedMap.entries()).map(([date, games]) => {
        const matchCount = games.filter(g => g.is_match).length;
        return {
          date,
          displayDate: formatDate(date),
          games,
          matchCount,
          totalCompleted: games.length,
        };
      });

      setHistory(grouped);
      setTotalStats({ games: data?.length || 0, matches: totalMatches });
      
      // Auto-expand most recent date
      if (grouped.length > 0 && expandedDates.size === 0) {
        setExpandedDates(new Set([grouped[0].date]));
      }
    } catch (err) {
      console.error('[FriendHistory] Fetch error:', err);
    }
  }, [friendshipId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchHistory();
      setIsLoading(false);
    };
    load();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryIcon = (category: string) => {
    const cat = QUESTION_CATEGORIES.find(c => c.id === category);
    return cat?.icon || '❓';
  };

  const getAnswerLabel = (options: string[], answerIndex: number | null): string => {
    if (answerIndex === null || answerIndex < 0 || answerIndex >= options.length) {
      return 'No answer';
    }
    return options[answerIndex];
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.greenAccent} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Game History</Text>
          <Text style={styles.headerSubtitle}>with {friendName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalStats.games}</Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalStats.matches}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {totalStats.games > 0 
              ? Math.round((totalStats.matches / totalStats.games) * 100) 
              : 0}%
          </Text>
          <Text style={styles.statLabel}>Match Rate</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.greenAccent}
          />
        }
      >
        {history.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Game History Yet</Text>
            <Text style={styles.emptyText}>
              Play some games with {friendName} and they'll appear here!
            </Text>
          </Card>
        ) : (
          history.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              {/* Date Header */}
              <TouchableOpacity
                style={styles.dateHeader}
                onPress={() => toggleDate(group.date)}
                activeOpacity={0.7}
              >
                <View style={styles.dateHeaderLeft}>
                  <Text style={styles.dateText}>{group.displayDate}</Text>
                  <Text style={styles.dateStats}>
                    {group.matchCount}/{group.totalCompleted} matched
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedDates.has(group.date) ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {/* Games List */}
              {expandedDates.has(group.date) && (
                <View style={styles.gamesList}>
                  {group.games.map((game, index) => (
                    <View key={game.id} style={styles.gameCard}>
                      {/* Question */}
                      <View style={styles.questionRow}>
                        <Text style={styles.categoryIcon}>
                          {getCategoryIcon(game.question?.category)}
                        </Text>
                        <Text style={styles.questionText}>
                          {game.question?.question || 'Question unavailable'}
                        </Text>
                      </View>

                      {/* Answers */}
                      <View style={styles.answersContainer}>
                        {/* Your Answer */}
                        <View style={styles.answerColumn}>
                          <Text style={styles.answerLabel}>You</Text>
                          <View style={[
                            styles.answerBubble,
                            game.is_match && styles.answerBubbleMatch
                          ]}>
                            <Text style={styles.answerText}>
                              {getAnswerLabel(
                                game.question?.options || [],
                                isInitiator ? game.initiator_answer : game.friend_answer
                              )}
                            </Text>
                          </View>
                        </View>

                        {/* Match Indicator */}
                        <View style={styles.matchIndicator}>
                          {game.is_match ? (
                            <LinearGradient
                              colors={[colors.greenAccent, colors.purpleLight]}
                              style={styles.matchBadge}
                            >
                              <Text style={styles.matchIcon}>✓</Text>
                            </LinearGradient>
                          ) : (
                            <View style={styles.mismatchBadge}>
                              <Text style={styles.mismatchIcon}>✗</Text>
                            </View>
                          )}
                        </View>

                        {/* Friend's Answer */}
                        <View style={styles.answerColumn}>
                          <Text style={styles.answerLabel}>{friendName}</Text>
                          <View style={[
                            styles.answerBubble,
                            game.is_match && styles.answerBubbleMatch
                          ]}>
                            <Text style={styles.answerText}>
                              {getAnswerLabel(
                                game.question?.options || [],
                                isInitiator ? game.friend_answer : game.initiator_answer
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 4,
    width: 60,
  },
  backText: {
    ...typography.body,
    color: colors.greenAccent,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  headerSpacer: {
    width: 60,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardDark,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 20,
    color: colors.greenAccent,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardDark,
    borderRadius: 12,
    padding: 14,
  },
  dateHeaderLeft: {
    flex: 1,
  },
  dateText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  dateStats: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  expandIcon: {
    ...typography.body,
    color: colors.textMuted,
  },
  gamesList: {
    marginTop: 8,
  },
  gameCard: {
    backgroundColor: colors.cardDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  questionText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  answersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  answerLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 6,
  },
  answerBubble: {
    backgroundColor: colors.darkBg,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  answerBubbleMatch: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  answerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  matchIndicator: {
    width: 40,
    alignItems: 'center',
  },
  matchBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchIcon: {
    color: colors.darkBg,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
  },
  mismatchBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mismatchIcon: {
    color: colors.coralPrimary,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
  },
});
