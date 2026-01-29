import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { getSupabase, TABLES, QUESTION_CATEGORIES, HistoryItem } from '../../../lib/supabase';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

interface GroupedHistory {
  date: string;
  displayDate: string;
  items: HistoryItem[];
}

export default function History() {
  const { user, userProfile } = useAuthStore();
  const { couple, partnerProfile } = useCoupleStore();
  const [history, setHistory] = useState<GroupedHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const loadHistory = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !couple?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Get completed daily sessions with question details
      const { data: sessions, error } = await supabase
        .from(TABLES.daily_sessions)
        .select(`
          id,
          question_id,
          user_a_answer,
          user_b_answer,
          is_match,
          completed_at,
          created_at,
          question:betterhalf_questions(id, question, category, options)
        `)
        .eq('couple_id', couple.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Transform and group by date
      const historyItems: HistoryItem[] = (sessions || []).map((session: any) => ({
        id: session.id,
        question_id: session.question_id,
        question_text: session.question?.question || 'Question not found',
        question_category: session.question?.category || 'daily_life',
        options: session.question?.options || [],
        user_a_answer: session.user_a_answer,
        user_b_answer: session.user_b_answer,
        is_match: session.is_match,
        completed_at: session.completed_at,
        created_at: session.created_at,
      }));

      // Group by date
      const grouped = groupByDate(historyItems);
      setHistory(grouped);
    } catch (err) {
      console.error('[History] Load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [couple?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  const groupByDate = (items: HistoryItem[]): GroupedHistory[] => {
    const groups: Record<string, HistoryItem[]> = {};

    items.forEach(item => {
      const date = new Date(item.completed_at);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      displayDate: formatDisplayDate(date),
      items,
    }));
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const getCategoryConfig = (category: string) => {
    return QUESTION_CATEGORIES.find(c => c.id === category) || 
      { icon: '❓', label: 'Unknown' };
  };

  const isPartnerA = user?.id === couple?.partner_a_id;
  const myName = userProfile?.display_name || 'You';
  const partnerName = partnerProfile?.display_name || 'Partner';

  const handleClose = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            tintColor={colors.purple}
          />
        }
      >
        {history.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>
              Complete daily questions with your partner to see your history here!
            </Text>
          </Card>
        ) : (
          history.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{group.displayDate}</Text>
              
              {group.items.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const categoryConfig = getCategoryConfig(item.question_category);
                
                // Determine which answer belongs to whom
                const myAnswer = isPartnerA ? item.user_a_answer : item.user_b_answer;
                const theirAnswer = isPartnerA ? item.user_b_answer : item.user_a_answer;
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => toggleExpanded(item.id)}
                  >
                    <Card style={styles.historyCard}>
                      {/* Header Row */}
                      <View style={styles.cardHeader}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
                          <Text style={styles.categoryLabel}>{categoryConfig.label}</Text>
                        </View>
                        <View style={[
                          styles.matchBadge,
                          item.is_match ? styles.matchSuccess : styles.matchMiss
                        ]}>
                          <Text style={styles.matchText}>
                            {item.is_match ? '✓ Match!' : '✗ Different'}
                          </Text>
                        </View>
                      </View>

                      {/* Question */}
                      <Text style={styles.questionText}>{item.question_text}</Text>

                      {/* Collapsed Preview */}
                      {!isExpanded && (
                        <View style={styles.previewRow}>
                          <Text style={styles.previewText}>
                            {myName}: {item.options[myAnswer ?? 0] || 'N/A'}
                          </Text>
                          <Text style={styles.expandHint}>Tap to see details</Text>
                        </View>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <View style={styles.answersContainer}>
                          <View style={styles.answerRow}>
                            <View style={styles.answerPerson}>
                              <Text style={styles.answerPersonName}>{myName}</Text>
                              <Text style={styles.youBadge}>(You)</Text>
                            </View>
                            <View style={[
                              styles.answerBox,
                              item.is_match && styles.answerBoxMatch
                            ]}>
                              <Text style={styles.answerText}>
                                {myAnswer !== null ? item.options[myAnswer] : 'No answer'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.answerRow}>
                            <View style={styles.answerPerson}>
                              <Text style={styles.answerPersonName}>{partnerName}</Text>
                            </View>
                            <View style={[
                              styles.answerBox,
                              item.is_match && styles.answerBoxMatch
                            ]}>
                              <Text style={styles.answerText}>
                                {theirAnswer !== null ? item.options[theirAnswer] : 'No answer'}
                              </Text>
                            </View>
                          </View>

                          {item.is_match && (
                            <View style={styles.matchCelebration}>
                              <Text style={styles.matchCelebrationText}>
                                💕 You both think alike!
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </Card>
                  </TouchableOpacity>
                );
              })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    fontSize: 20,
    color: colors.textMuted,
    padding: 4,
  },
  headerTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
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
    paddingBottom: 40,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
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
    marginBottom: 24,
  },
  dateHeader: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  historyCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchSuccess: {
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  matchMiss: {
    backgroundColor: 'rgba(255,107,107,0.2)',
  },
  matchText: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
  questionText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  expandHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  answersContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  answerRow: {
    marginBottom: 12,
  },
  answerPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  answerPersonName: {
    ...typography.captionBold,
    color: colors.textMuted,
  },
  youBadge: {
    ...typography.caption,
    color: colors.purpleLight,
    marginLeft: 6,
  },
  answerBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  answerBoxMatch: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  answerText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  matchCelebration: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 12,
  },
  matchCelebrationText: {
    ...typography.bodySmall,
    color: colors.success,
  },
});
