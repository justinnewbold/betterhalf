import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuestionCard } from '../../../components/game/QuestionCard';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SyncScoreRing } from '../../../components/game/SyncScoreRing';
import { WaitingAnimation } from '../../../components/game/WaitingAnimation';
import { AnswerReveal } from '../../../components/game/AnswerReveal';
import { QuestionSkeleton } from '../../../components/ui/Skeleton';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { usePresenceStore } from '../../../stores/presenceStore';
import { useThemeStore } from '../../../stores/themeStore';
import { useAchievementStore } from '../../../stores/achievementStore';
import { PartnerAnsweringIndicator } from '../../../components/ui/PartnerStatus';
import { getSupabase, TABLES, QuestionCategory } from '../../../lib/supabase';
import { colors, getThemeColors } from '../../../constants/colors';
import { Confetti, CelebrationBurst } from '../../../components/ui/Confetti';
import { typography, fontFamilies } from '../../../constants/typography';
import { hapticSuccess, hapticError } from '../../../lib/haptics';

type GamePhase = 'loading' | 'question' | 'waiting' | 'reveal' | 'results' | 'already_played' | 'error';

interface Question {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
}

interface GameSession {
  id: string;
  question_id: string;
  couple_id: string;
  user_a_answer: number | null;
  user_b_answer: number | null;
  is_match: boolean | null;
  completed_at: string | null;
  created_at: string;
}

export default function DailySyncGame() {
  const { user } = useAuthStore();
  const { couple, partnerProfile, fetchCouple, refreshCoupleData, stats, streak } = useCoupleStore();
  const { partnerState, partnerCurrentScreen, updateMyState, isConnected } = usePresenceStore();
  const { isDark } = useThemeStore();
  const { fetchAchievements, checkAndUnlock, hasFetched: achievementsFetched } = useAchievementStore();
  const themeColors = getThemeColors(isDark);
  
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [question, setQuestion] = useState<Question | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [partnerOption, setPartnerOption] = useState<number | null>(null);
  const [isMatch, setIsMatch] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [syncScore, setSyncScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [revealAnimationComplete, setRevealAnimationComplete] = useState(false);
  const [achievementsChecked, setAchievementsChecked] = useState(false);

  const isUserA = couple?.partner_a_id === user?.id;
  const connectionName = partnerProfile?.display_name || 'Your Partner';

  // Fetch achievements on mount
  useEffect(() => {
    if (user?.id && !achievementsFetched) {
      fetchAchievements(user.id);
    }
  }, [user?.id, achievementsFetched]);

  // Track presence
  useEffect(() => {
    if (couple?.id && isConnected) {
      updateMyState('online', 'daily');
    }
    return () => {
      if (isConnected) {
        updateMyState('online', 'home');
      }
    };
  }, [couple?.id, isConnected]);

  // Check for achievements when game completes (results phase)
  useEffect(() => {
    const checkAchievements = async () => {
      if (phase === 'results' && user?.id && !achievementsChecked && stats && streak) {
        setAchievementsChecked(true);
        
        // Calculate if this was a "perfect day" (all questions matched)
        const perfectDay = isMatch; // For daily sync, one question = perfect if matched
        
        await checkAndUnlock(user.id, {
          currentStreak: streak.current_streak || 0,
          totalGames: (stats.total_games || 0) + 1, // Include this game
          totalMatches: (stats.total_matches || 0) + (isMatch ? 1 : 0),
          perfectDay,
        });
      }
    };
    
    checkAchievements();
  }, [phase, user?.id, achievementsChecked, stats, streak, isMatch]);

  // Poll for partner's answer when waiting
  useEffect(() => {
    if (phase !== 'waiting' || !session?.id) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from(TABLES.daily_sessions)
          .select('*')
          .eq('id', session.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          const myAnswer = isUserA ? data.user_a_answer : data.user_b_answer;
          const theirAnswer = isUserA ? data.user_b_answer : data.user_a_answer;
          
          if (myAnswer !== null && theirAnswer !== null) {
            // Both answered
            setPartnerOption(theirAnswer);
            setIsMatch(data.is_match ?? false);
            setSession(data);
            clearInterval(pollInterval);
            
            // Trigger haptic based on match
            if (data.is_match) {
              hapticSuccess();
            } else {
              hapticError();
            }
            
            setPhase('reveal');
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [phase, session?.id, isUserA]);

  // Load game on mount
  useEffect(() => {
    loadGame();
  }, [couple?.id]);

  const loadGame = async () => {
    if (!couple?.id || !user?.id) {
      setPhase('loading');
      return;
    }

    try {
      const supabase = getSupabase();
      const today = new Date().toISOString().split('T')[0];
      
      // Check for existing game today
      const { data: existingGame, error: gameError } = await supabase
        .from(TABLES.daily_sessions)
        .select('*')
        .eq('couple_id', couple.id)
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59.999')
        .maybeSingle();
      
      if (gameError) {
        throw gameError;
      }
      
      if (existingGame) {
        const myAnswer = isUserA ? existingGame.user_a_answer : existingGame.user_b_answer;
        const theirAnswer = isUserA ? existingGame.user_b_answer : existingGame.user_a_answer;
        
        if (myAnswer !== null && theirAnswer !== null) {
          // Game already completed
          setSession(existingGame);
          setSelectedOption(myAnswer);
          setPartnerOption(theirAnswer);
          setIsMatch(existingGame.is_match ?? false);
          
          // Fetch streak and stats
          await fetchGameStats();
          
          // Load question for display
          const { data: q } = await supabase
            .from(TABLES.questions)
            .select('*')
            .eq('id', existingGame.question_id)
            .single();
          
          if (q) {
            setQuestion({
              id: q.id,
              category: q.category,
              difficulty: q.difficulty || 'medium',
              question: q.question,
              options: q.options as string[],
            });
          }
          
          setPhase('already_played');
          return;
        } else if (myAnswer !== null) {
          // I've answered, waiting for partner
          setSession(existingGame);
          setSelectedOption(myAnswer);
          
          const { data: q } = await supabase
            .from(TABLES.questions)
            .select('*')
            .eq('id', existingGame.question_id)
            .single();
          
          if (q) {
            setQuestion({
              id: q.id,
              category: q.category,
              difficulty: q.difficulty || 'medium',
              question: q.question,
              options: q.options as string[],
            });
          }
          
          setPhase('waiting');
          return;
        } else {
          // Partner started, I haven't answered
          setSession(existingGame);
          
          const { data: q } = await supabase
            .from(TABLES.questions)
            .select('*')
            .eq('id', existingGame.question_id)
            .single();
          
          if (q) {
            setQuestion({
              id: q.id,
              category: q.category,
              difficulty: q.difficulty || 'medium',
              question: q.question,
              options: q.options as string[],
            });
          }
          
          setPhase('question');
          return;
        }
      }
      
      // No game today - create new one
      await createNewGame();
      
    } catch (err) {
      console.error('Load game error:', err);
      setErrorMessage('Failed to load game');
      setPhase('error');
    }
  };

  const createNewGame = async () => {
    if (!couple?.id || !user?.id) return;
    
    try {
      const supabase = getSupabase();
      
      // Get couple's preferred categories
      const preferredCategories = couple.preferred_categories || ['daily_life', 'romance', 'deep_talks', 'fun', 'spice'];
      
      // Get random question from preferred categories
      const { data: questions, error: qError } = await supabase
        .from(TABLES.questions)
        .select('*')
        .in('category', preferredCategories)
        .eq('for_couples', true);
      
      if (qError) throw qError;
      if (!questions || questions.length === 0) {
        throw new Error('No questions available');
      }
      
      // Pick random question
      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      
      const today = new Date().toISOString().split('T')[0];
      
      // Create game session
      const { data: newGame, error: createError } = await supabase
        .from(TABLES.daily_sessions)
        .insert({
          couple_id: couple.id,
          question_id: randomQ.id,
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      setSession(newGame);
      setQuestion({
        id: randomQ.id,
        category: randomQ.category,
        difficulty: randomQ.difficulty || 'medium',
        question: randomQ.question,
        options: randomQ.options as string[],
      });
      setPhase('question');
      
    } catch (err) {
      console.error('Create game error:', err);
      setErrorMessage('Failed to create game');
      setPhase('error');
    }
  };

  const fetchGameStats = async () => {
    if (!couple?.id) return;
    
    try {
      const supabase = getSupabase();
      
      // Get streak
      const { data: streakData } = await supabase
        .from(TABLES.streaks)
        .select('*')
        .eq('couple_id', couple.id)
        .single();
      
      if (streakData) {
        setCurrentStreak(streakData.current_streak || 0);
      }
      
      // Get stats
      const { data: statsData } = await supabase
        .from(TABLES.couple_stats)
        .select('*')
        .eq('couple_id', couple.id)
        .single();
      
      if (statsData) {
        const total = statsData.total_games || 0;
        const matches = statsData.total_matches || 0;
        setSyncScore(total > 0 ? Math.round((matches / total) * 100) : 0);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const handleSelectOption = async (optionIndex: number) => {
    if (selectedOption !== null || !session?.id || !user?.id) return;
    
    setSelectedOption(optionIndex);
    
    try {
      const supabase = getSupabase();
      
      const updateField = isUserA ? 'user_a_answer' : 'user_b_answer';
      
      // Update game with my answer
      const { data: updatedGame, error } = await supabase
        .from(TABLES.daily_sessions)
        .update({ [updateField]: optionIndex })
        .eq('id', session.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Check if partner already answered
      const theirAnswer = isUserA ? updatedGame.user_b_answer : updatedGame.user_a_answer;
      
      if (theirAnswer !== null) {
        // Both answered - calculate match
        const matched = optionIndex === theirAnswer;
        
        await supabase
          .from(TABLES.daily_sessions)
          .update({ 
            is_match: matched,
            completed_at: new Date().toISOString(),
          })
          .eq('id', session.id);
        
        setPartnerOption(theirAnswer);
        setIsMatch(matched);
        setSession({ ...updatedGame, is_match: matched });
        
        // Trigger haptic
        if (matched) {
          hapticSuccess();
        } else {
          hapticError();
        }
        
        // Update streak if matched
        if (matched && couple?.id) {
          await supabase.rpc('update_couple_streak', { p_couple_id: couple.id });
        }
        
        await fetchGameStats();
        await refreshCoupleData();
        setPhase('reveal');
      } else {
        // Waiting for partner
        setSession(updatedGame);
        setPhase('waiting');
      }
      
    } catch (err) {
      console.error('Submit answer error:', err);
      setSelectedOption(null);
    }
  };

  const handleContinue = async () => {
    if (isMatch) {
      setShowConfetti(true);
      setShowBurst(true);
      setTimeout(() => {
        setShowConfetti(false);
        setShowBurst(false);
        setPhase('results');
      }, 1500);
    } else {
      setPhase('results');
    }
  };

  const handleRevealComplete = useCallback(() => {
    setRevealAnimationComplete(true);
  }, []);

  const handleFinish = () => {
    router.replace('/(main)/(tabs)');
  };

  // Dynamic styles
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    loadingText: {
      ...typography.body,
      color: themeColors.textPrimaryMuted,
      marginTop: 16,
    },
    headerTitle: {
      fontFamily: fontFamilies.bodyBold,
      fontSize: 20,
      color: themeColors.textPrimary,
    },
    questionNumber: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: themeColors.coral,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    categoryBadge: {
      backgroundColor: `${themeColors.coral}20`,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'center' as const,
      marginBottom: 16,
    },
    categoryText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: themeColors.coral,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    waitingTitle: {
      fontFamily: fontFamilies.bodyBold,
      fontSize: 20,
      color: themeColors.textPrimary,
      textAlign: 'center' as const,
      marginTop: 24,
    },
    waitingSubtitle: {
      ...typography.body,
      color: themeColors.textPrimarySecondary,
      textAlign: 'center' as const,
      marginTop: 8,
    },
    resultsLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: themeColors.coral,
      textTransform: 'uppercase' as const,
      letterSpacing: 2,
      marginBottom: 8,
    },
    resultsTitle: {
      fontFamily: fontFamilies.bodyBold,
      fontSize: 28,
      color: themeColors.textPrimary,
      textAlign: 'center' as const,
      marginBottom: 24,
    },
    statLabel: {
      ...typography.caption,
      color: themeColors.textPrimaryMuted,
      marginTop: 4,
    },
    statValue: {
      fontFamily: fontFamilies.bodyBold,
      fontSize: 24,
      color: themeColors.textPrimary,
    },
    errorText: {
      ...typography.body,
      color: themeColors.error,
      textAlign: 'center' as const,
      marginBottom: 16,
    },
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      daily_life: '☀️',
      romance: '💕',
      deep_talks: '💭',
      fun: '🎉',
      spice: '🔥',
      history: '📚',
      heart: '❤️',
      custom: '✨',
    };
    return emojis[category] || '💫';
  };

  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Confetti effects */}
      {showConfetti && <Confetti intensity="heavy" />}
      {showBurst && <CelebrationBurst />}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: themeColors.textPrimaryMuted }]}>✕</Text>
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Daily Sync</Text>
        <View style={styles.closeButton} />
      </View>

      {/* Loading */}
      {phase === 'loading' && (
        <View style={styles.centerContent}>
          <QuestionSkeleton />
          <Text style={dynamicStyles.loadingText}>Loading today's question...</Text>
        </View>
      )}

      {/* Question Phase */}
      {phase === 'question' && question && (
        <View style={styles.gameContent}>
          <Text style={dynamicStyles.questionNumber}>Today's Question</Text>
          <View style={dynamicStyles.categoryBadge}>
            <Text style={dynamicStyles.categoryText}>
              {getCategoryEmoji(question.category)} {formatCategory(question.category)}
            </Text>
          </View>
          
          <QuestionCard
            question={question}
            selectedIndex={selectedOption ?? undefined}
            onSelectOption={handleSelectOption}
          />
          
          {partnerCurrentScreen === 'daily' && (
            <PartnerAnsweringIndicator partnerName={connectionName} />
          )}
        </View>
      )}

      {/* Waiting Phase */}
      {phase === 'waiting' && (
        <View style={styles.centerContent}>
          <WaitingAnimation
            partnerName={connectionName}
            isPartnerOnline={partnerState === 'online'}
            isPartnerPlaying={partnerCurrentScreen === 'daily'}
          />
          <Text style={dynamicStyles.waitingTitle}>Answer Submitted!</Text>
          <Text style={dynamicStyles.waitingSubtitle}>
            Waiting for {connectionName} to answer...
          </Text>
        </View>
      )}

      {/* Reveal Phase */}
      {phase === 'reveal' && question && selectedOption !== null && partnerOption !== null && (
        <View style={styles.gameContent}>
          <AnswerReveal
            question={question.question}
            yourAnswer={question.options[selectedOption]}
            partnerAnswer={question.options[partnerOption]}
            partnerName={connectionName}
            isMatch={isMatch}
            onAnimationComplete={handleRevealComplete}
          />
          
          {revealAnimationComplete && (
            <View style={styles.continueContainer}>
              <Button
                title={isMatch ? "Celebrate! 🎉" : "Continue"}
                onPress={handleContinue}
                variant="primary"
                size="large"
              />
            </View>
          )}
        </View>
      )}

      {/* Results Phase */}
      {phase === 'results' && (
        <View style={styles.centerContent}>
          <Text style={dynamicStyles.resultsLabel}>DAILY SYNC COMPLETE</Text>
          <Text style={dynamicStyles.resultsTitle}>
            {isMatch ? "Perfect Sync! 💕" : "Close enough! 😊"}
          </Text>
          <Card style={styles.resultsCard} variant="elevated" padding="large">
            <View style={styles.resultsRow}>
              <View style={styles.statItem}>
                <Text style={dynamicStyles.statValue}>{currentStreak}</Text>
                <Text style={dynamicStyles.statLabel}>Day Streak 🔥</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <SyncScoreRing percentage={syncScore} size="small" />
                <Text style={dynamicStyles.statLabel}>Sync Score</Text>
              </View>
            </View>
          </Card>
          
          <View style={styles.finishContainer}>
            <Button
              title="Done"
              onPress={handleFinish}
              variant="primary"
              size="large"
            />
          </View>
        </View>
      )}

      {/* Already Played Phase */}
      {phase === 'already_played' && question && selectedOption !== null && partnerOption !== null && (
        <View style={styles.centerContent}>
          <Text style={dynamicStyles.resultsLabel}>ALREADY PLAYED TODAY</Text>
          <Text style={dynamicStyles.resultsTitle}>
            {isMatch ? "You matched! 💕" : "Different answers"}
          </Text>
          
          <Card style={styles.alreadyPlayedCard} variant="elevated" padding="medium">
            <Text style={[styles.questionText, { color: themeColors.textPrimary }]}>
              {question.question}
            </Text>
            <View style={styles.answersContainer}>
              <View style={styles.answerBox}>
                <Text style={[styles.answerLabel, { color: themeColors.textPrimaryMuted }]}>You</Text>
                <Text style={[styles.answerText, { color: themeColors.textPrimary }]}>
                  {question.options[selectedOption]}
                </Text>
              </View>
              <View style={styles.answerBox}>
                <Text style={[styles.answerLabel, { color: themeColors.textPrimaryMuted }]}>{connectionName}</Text>
                <Text style={[styles.answerText, { color: themeColors.textPrimary }]}>
                  {question.options[partnerOption]}
                </Text>
              </View>
            </View>
          </Card>
          
          <View style={styles.finishContainer}>
            <Button
              title="Back to Home"
              onPress={handleFinish}
              variant="primary"
              size="large"
            />
          </View>
        </View>
      )}

      {/* Error Phase */}
      {phase === 'error' && (
        <View style={styles.centerContent}>
          <Text style={dynamicStyles.errorText}>{errorMessage || 'Something went wrong'}</Text>
          <Button
            title="Try Again"
            onPress={loadGame}
            variant="primary"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  gameContent: {
    flex: 1,
    padding: 24,
  },
  continueContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resultsCard: {
    width: '100%',
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  finishContainer: {
    marginTop: 32,
    width: '100%',
  },
  alreadyPlayedCard: {
    width: '100%',
    marginTop: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  answersContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  answerBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  answerLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
