import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../constants/colors';
import { useFriendsStore } from '../../../../stores/friendsStore';
import { useAuthStore } from '../../../../stores/authStore';
import { getOrCreateTodaysGames, submitAnswer, getDailyProgress } from '../../../../lib/friendGameService';
import type { FriendGameWithQuestion, FriendWithUser } from '../../../../lib/supabase';
import { QUESTION_CATEGORIES } from '../../../../lib/supabase';

export default function FriendPlayScreen() {
  const { friendshipId } = useLocalSearchParams<{ friendshipId: string }>();
  const { user } = useAuthStore();
  const { getFriendById, fetchFriends } = useFriendsStore();
  
  const [friend, setFriend] = useState<FriendWithUser | null>(null);
  const [games, setGames] = useState<FriendGameWithQuestion[]>([]);
  const [currentGame, setCurrentGame] = useState<FriendGameWithQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isMatch: boolean | null; waiting: boolean } | null>(null);
  const [progress, setProgress] = useState({ answered: 0, total: 0, matches: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadData();
  }, [friendshipId, user?.id]);

  const loadData = async () => {
    if (!friendshipId || !user?.id) return;

    setIsLoading(true);
    await fetchFriends(user.id);
    
    const foundFriend = getFriendById(friendshipId);
    if (!foundFriend) {
      setIsLoading(false);
      return;
    }
    
    setFriend(foundFriend);

    const { games: todaysGames, error } = await getOrCreateTodaysGames(foundFriend, user.id);
    
    if (error) {
      setIsLoading(false);
      return;
    }

    setGames(todaysGames);
    
    const isInitiator = foundFriend.user_id === user.id;
    const nextGame = todaysGames.find(g => 
      isInitiator ? g.initiator_answer === null : g.friend_answer === null
    );
    
    setCurrentGame(nextGame || null);

    const prog = await getDailyProgress(friendshipId, user.id, foundFriend);
    setProgress({
      answered: prog.answeredByUser,
      total: prog.totalQuestions,
      matches: prog.matches,
    });

    setIsLoading(false);
  };

  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null || isSubmitting) return;
    setSelectedAnswer(index);
    
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || !currentGame || !friend || !user?.id) return;

    setIsSubmitting(true);
    const { isMatch, error } = await submitAnswer(currentGame.id, selectedAnswer, user.id, friend);
    setIsSubmitting(false);

    if (error) return;

    setLastResult({ isMatch, waiting: isMatch === null });
    setShowResult(true);
  };

  const handleNext = async () => {
    setShowResult(false);
    setSelectedAnswer(null);
    setLastResult(null);
    await loadData();
  };

  const getCategoryInfo = (category: string) => {
    return QUESTION_CATEGORIES.find(c => c.id === category) || { label: 'Question', icon: '❓' };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!friend) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>Friend not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const friendName = friend.nickname || friend.friend_user?.display_name || 'Friend';

  if (!currentGame && !showResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.headerBack}>← Back</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.centerContainer}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.completedTitle}>All done for today!</Text>
          <Text style={styles.completedSubtitle}>
            You answered all {progress.total} questions with {friendName}
          </Text>
          
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.matches}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {progress.total > 0 ? Math.round((progress.matches / progress.total) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Sync Rate</Text>
            </View>
          </View>

          <Text style={styles.comeBackText}>Come back tomorrow for new questions!</Text>
          
          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showResult && lastResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          {lastResult.waiting ? (
            <>
              <Text style={styles.resultEmoji}>⏳</Text>
              <Text style={styles.resultTitle}>Answer recorded!</Text>
              <Text style={styles.resultSubtitle}>Waiting for {friendName} to answer</Text>
            </>
          ) : lastResult.isMatch ? (
            <>
              <Text style={styles.resultEmoji}>💚</Text>
              <Text style={styles.resultTitle}>It's a Match!</Text>
              <Text style={styles.resultSubtitle}>You and {friendName} think alike! 🎯</Text>
            </>
          ) : (
            <>
              <Text style={styles.resultEmoji}>💔</Text>
              <Text style={styles.resultTitle}>Different Answers</Text>
              <Text style={styles.resultSubtitle}>Different thoughts this time</Text>
            </>
          )}
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>{lastResult.waiting ? 'Continue' : 'Next Question'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryInfo = getCategoryInfo(currentGame?.question?.category || '');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBack}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friendName}</Text>
        <Text style={styles.headerProgress}>{progress.answered + 1}/{progress.total}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(progress.answered / Math.max(progress.total, 1)) * 100}%` }]} />
      </View>

      <View style={styles.questionContainer}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
          <Text style={styles.categoryLabel}>{categoryInfo.label}</Text>
        </View>

        <Text style={styles.questionText}>{currentGame?.question?.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentGame?.question?.options.map((option, index) => (
          <Animated.View key={index} style={{ transform: [{ scale: selectedAnswer === index ? scaleAnim : 1 }] }}>
            <TouchableOpacity
              style={[styles.optionButton, selectedAnswer === index && styles.optionSelected]}
              onPress={() => handleSelectAnswer(index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, selectedAnswer === index && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {selectedAnswer !== null && (
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.darkBg },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: colors.textMuted, marginTop: 16, fontSize: 16 },
  errorEmoji: { fontSize: 64, marginBottom: 16 },
  errorText: { fontSize: 18, color: colors.textPrimary, marginBottom: 24 },
  backBtn: { backgroundColor: colors.coral, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerBack: { color: colors.coral, fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  headerProgress: { color: colors.textMuted, fontSize: 14 },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20 },
  progressFill: { height: '100%', backgroundColor: colors.coral, borderRadius: 2 },
  completedEmoji: { fontSize: 64, marginBottom: 16 },
  completedTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  completedSubtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginBottom: 32 },
  statsCard: { flexDirection: 'row', backgroundColor: colors.cardDark, borderRadius: 16, padding: 24, marginBottom: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: colors.coral },
  statLabel: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20 },
  comeBackText: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  doneButton: { backgroundColor: colors.coral, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultEmoji: { fontSize: 80, marginBottom: 24 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  resultSubtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginBottom: 40 },
  nextButton: { backgroundColor: colors.coral, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  questionContainer: { padding: 24, alignItems: 'center' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryLabel: { fontSize: 13, color: colors.textMuted },
  questionText: { fontSize: 24, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', lineHeight: 32 },
  optionsContainer: { flex: 1, paddingHorizontal: 24, gap: 12 },
  optionButton: { backgroundColor: colors.cardDark, borderRadius: 16, padding: 20, borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { borderColor: colors.coral, backgroundColor: 'rgba(255, 107, 107, 0.1)' },
  optionText: { fontSize: 16, color: colors.textPrimary, textAlign: 'center' },
  optionTextSelected: { color: colors.coral, fontWeight: '600' },
  submitButton: { backgroundColor: colors.coral, marginHorizontal: 24, marginBottom: 24, padding: 18, borderRadius: 16, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
