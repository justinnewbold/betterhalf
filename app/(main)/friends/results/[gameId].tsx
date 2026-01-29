import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import { useFriendsStore } from '../../../../stores/friendsStore';

interface GameResult {
  id: string;
  friendship_id: string;
  question_id: string;
  game_date: string;
  question_number: number;
  status: string;
  initiator_answer: number | null;
  friend_answer: number | null;
  is_match: boolean | null;
  question?: {
    question_text: string;
    option_1: string;
    option_2: string;
    option_3: string;
    option_4: string;
    category: string;
  };
}

interface FriendshipInfo {
  id: string;
  nickname: string | null;
  relationship_type: string;
  friend_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export default function FriendGameResultsScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const { friends } = useFriendsStore();
  
  const [loading, setLoading] = useState(true);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [friendshipInfo, setFriendshipInfo] = useState<FriendshipInfo | null>(null);
  const [isInitiator, setIsInitiator] = useState(true);
  const [todayProgress, setTodayProgress] = useState({ completed: 0, total: 10 });
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const myAnswerAnim = useState(new Animated.Value(0))[0];
  const friendAnswerAnim = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    if (gameId) {
      fetchGameResult();
    }
  }, [gameId]);
  
  useEffect(() => {
    if (gameResult) {
      // Start animations
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(myAnswerAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(friendAnswerAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Show confetti if it's a match
        if (gameResult.is_match) {
          setShowConfetti(true);
        }
      });
    }
  }, [gameResult]);
  
  const fetchGameResult = async () => {
    try {
      setLoading(true);
      
      // Fetch the game result with question details
      const { data: game, error: gameError } = await supabase
        .from('betterhalf_friend_games')
        .select(`
          *,
          question:betterhalf_questions(
            question_text,
            option_1,
            option_2,
            option_3,
            option_4,
            category
          )
        `)
        .eq('id', gameId)
        .single();
      
      if (gameError) throw gameError;
      
      setGameResult(game);
      
      // Get current user to determine if initiator
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch friendship info
      const { data: friendship, error: friendError } = await supabase
        .from('betterhalf_friends')
        .select(`
          id,
          user_id,
          friend_id,
          nickname,
          relationship_type,
          daily_limit
        `)
        .eq('id', game.friendship_id)
        .single();
      
      if (friendError) throw friendError;
      
      setIsInitiator(friendship.user_id === user?.id);
      
      // Get friend's profile
      const friendUserId = friendship.user_id === user?.id 
        ? friendship.friend_id 
        : friendship.user_id;
      
      const { data: friendProfile } = await supabase
        .from('betterhalf_users')
        .select('display_name, avatar_url')
        .eq('id', friendUserId)
        .single();
      
      setFriendshipInfo({
        ...friendship,
        friend_profile: friendProfile,
      });
      
      // Get today's progress
      const today = new Date().toISOString().split('T')[0];
      const { data: todayGames } = await supabase
        .from('betterhalf_friend_games')
        .select('id, status')
        .eq('friendship_id', game.friendship_id)
        .eq('game_date', today);
      
      const completedGames = todayGames?.filter(g => g.status === 'completed').length || 0;
      setTodayProgress({
        completed: completedGames,
        total: friendship.daily_limit || 10,
      });
      
    } catch (error) {
      console.error('Error fetching game result:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getAnswerText = (answerIndex: number | null) => {
    if (answerIndex === null || !gameResult?.question) return 'No answer';
    const options = [
      gameResult.question.option_1,
      gameResult.question.option_2,
      gameResult.question.option_3,
      gameResult.question.option_4,
    ].filter(Boolean);
    return options[answerIndex - 1] || 'Unknown';
  };
  
  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      daily_life: '☀️',
      romance: '💕',
      deep_talks: '💭',
      spice: '🔥',
      fun: '🎉',
      history: '📚',
      custom: '✨',
    };
    return emojis[category] || '❓';
  };
  
  const getFriendName = () => {
    if (friendshipInfo?.nickname) return friendshipInfo.nickname;
    return friendshipInfo?.friend_profile?.display_name || 'Friend';
  };
  
  const handlePlayNext = () => {
    if (friendshipInfo) {
      router.replace(`/(main)/friends/play/${friendshipInfo.id}`);
    }
  };
  
  const handleBackToFriends = () => {
    router.replace('/(main)/friends');
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }
  
  if (!gameResult || !gameResult.question) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={styles.errorText}>Result not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToFriends}>
          <Text style={styles.backButtonText}>Back to Friends</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const myAnswer = isInitiator ? gameResult.initiator_answer : gameResult.friend_answer;
  const theirAnswer = isInitiator ? gameResult.friend_answer : gameResult.initiator_answer;
  const hasMoreQuestions = todayProgress.completed < todayProgress.total;
  
  return (
    <View style={styles.container}>
      {/* Match Celebration */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <Text style={styles.confettiEmoji}>🎉</Text>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToFriends} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {gameResult.question_number} of {todayProgress.total}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(todayProgress.completed / todayProgress.total) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>
      
      {/* Result Card */}
      <Animated.View 
        style={[
          styles.resultCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Match Status */}
        <View style={[
          styles.matchBadge,
          gameResult.is_match ? styles.matchBadgeSuccess : styles.matchBadgeMiss
        ]}>
          <Ionicons 
            name={gameResult.is_match ? "heart" : "heart-dislike"} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.matchText}>
            {gameResult.is_match ? "You Matched! 🎉" : "Different Picks"}
          </Text>
        </View>
        
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.categoryBadge}>
            {getCategoryEmoji(gameResult.question.category)} {gameResult.question.category.replace('_', ' ')}
          </Text>
          <Text style={styles.questionText}>{gameResult.question.question_text}</Text>
        </View>
        
        {/* Answers Comparison */}
        <View style={styles.answersContainer}>
          {/* My Answer */}
          <Animated.View 
            style={[
              styles.answerCard,
              gameResult.is_match && styles.answerCardMatch,
              { opacity: myAnswerAnim }
            ]}
          >
            <Text style={styles.answerLabel}>You</Text>
            <View style={[
              styles.answerBubble,
              gameResult.is_match && styles.answerBubbleMatch
            ]}>
              <Text style={styles.answerText}>{getAnswerText(myAnswer)}</Text>
            </View>
          </Animated.View>
          
          {/* VS Divider */}
          <View style={styles.vsDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          
          {/* Friend's Answer */}
          <Animated.View 
            style={[
              styles.answerCard,
              gameResult.is_match && styles.answerCardMatch,
              { opacity: friendAnswerAnim }
            ]}
          >
            <Text style={styles.answerLabel}>{getFriendName()}</Text>
            <View style={[
              styles.answerBubble,
              gameResult.is_match && styles.answerBubbleMatch
            ]}>
              <Text style={styles.answerText}>{getAnswerText(theirAnswer)}</Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {hasMoreQuestions ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handlePlayNext}>
            <Text style={styles.primaryButtonText}>Next Question</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.completedContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={styles.completedText}>
              All done for today! 🎉
            </Text>
            <Text style={styles.completedSubtext}>
              Come back tomorrow for more questions
            </Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToFriends}>
          <Text style={styles.secondaryButtonText}>Back to Friends</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: '#666',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E91E63',
    borderRadius: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  progressContainer: {
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E91E63',
    borderRadius: 3,
  },
  resultCard: {
    flex: 1,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 24,
    alignSelf: 'center',
  },
  matchBadgeSuccess: {
    backgroundColor: '#4CAF50',
  },
  matchBadgeMiss: {
    backgroundColor: '#9E9E9E',
  },
  matchText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  questionSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  categoryBadge: {
    fontSize: 14,
    color: '#E91E63',
    backgroundColor: '#FCE4EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
  },
  answersContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  answerCard: {
    marginVertical: 8,
  },
  answerCardMatch: {
    // Optional: Add special styling for matches
  },
  answerLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  answerBubble: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  answerBubbleMatch: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  answerText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  vsDivider: {
    alignItems: 'center',
    marginVertical: 8,
  },
  vsText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '700',
  },
  actionsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  completedContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  completedText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  completedSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  confettiContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  confettiEmoji: {
    fontSize: 60,
  },
});
