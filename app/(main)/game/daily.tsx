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
  game_date: string;
  status: string;
  initiator_answer: number | null;
  partner_answer: number | null;
  is_match: boolean | null;
}

export default function DailySyncGame() {
  const { user } = useAuthStore();
  const { couple, partner, loadCouple, refreshCoupleData } = useCoupleStore();
  const { partnerState, partnerCurrentScreen, startTracking, stopTracking, setCurrentScreen } = usePresenceStore();
  const { isDark } = useThemeStore();
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

  const isInitiator = couple?.user1_id === user?.id;
  const connectionName = partner?.nickname || partner?.display_name || 'Your Partner';

  // Track presence
  useEffect(() => {
    if (couple?.id) {
      startTracking(couple.id, 'daily');
      setCurrentScreen('daily');
    }
    return () => {
      stopTracking();
    };
  }, [couple?.id]);

  // Poll for partner's answer when waiting
  useEffect(() => {
    if (phase !== 'waiting' || !session?.id) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from(TABLES.GAMES)
          .select('*')
          .eq('id', session.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          const myAnswer = isInitiator ? data.initiator_answer : data.partner_answer;
          const theirAnswer = isInitiator ? data.partner_answer : data.initiator_answer;
          
          if (myAnswer !== null && theirAnswer !== null) {
            // Both answered
            setPartnerOption(theirAnswer);
            setIsMatch(data.is_match ?? false);
            setSession(data);
            setPhase('reveal');
            
            // Haptic feedback
            if (data.is_match) {
              hapticSuccess();
            } else {
              hapticError();
            }
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [phase, session?.id, isInitiator]);

  // Load game on mount
  useEffect(() => {
    loadGameData();
  }, [couple?.id]);

  const loadGameData = async () => {
    if (!couple?.id || !user?.id) {
      setPhase('error');
      setErrorMessage('Please set up your partner connection first.');
      return;
    }

    setPhase('loading');
    
    try {
      const supabase = getSupabase();
      const today = new Date().toISOString().split('T')[0];
      
      // Check for existing game today
      const { data: existingGame, error: gameError } = await supabase
        .from(TABLES.GAMES)
        .select('*, question:question_id(*)')
        .eq('couple_id', couple.id)
        .eq('game_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (existingGame && !gameError) {
        setSession(existingGame);
        setQuestion(existingGame.question);
        
        const myAnswer = isInitiator ? existingGame.initiator_answer : existingGame.partner_answer;
        const theirAnswer = isInitiator ? existingGame.partner_answer : existingGame.initiator_answer;
        
        if (existingGame.status === 'completed') {
          // Already played
          setSelectedOption(myAnswer);
          setPartnerOption(theirAnswer);
          setIsMatch(existingGame.is_match ?? false);
          setPhase('already_played');
        } else if (myAnswer !== null && theirAnswer !== null) {
          // Both answered
          setSelectedOption(myAnswer);
          setPartnerOption(theirAnswer);
          setIsMatch(existingGame.is_match ?? false);
          setPhase('reveal');
        } else if (myAnswer !== null) {
          // I answered, waiting for partner
          setSelectedOption(myAnswer);
          setPhase('waiting');
        } else if (theirAnswer !== null) {
          // Partner answered, my turn
          setPhase('question');
        } else {
          // No one answered yet
          setPhase('question');
        }
      } else {
        // Create new game
        await createNewGame();
      }
      
      // Load streak data
      await loadStreakData();
      
    } catch (err) {
      console.error('Load game error:', err);
      setPhase('error');
      setErrorMessage('Failed to load game. Please try again.');
    }
  };

  const createNewGame = async () => {
    if (!couple?.id) return;
    
    try {
      const supabase = getSupabase();
      
      // Get preferred categories
      const categories = couple.preferred_categories || ['daily_life', 'heart', 'fun', 'history', 'deep_talks'];
      
      // Fetch random question from preferred categories
      const { data: questions, error: qError } = await supabase
        .from(TABLES.QUESTIONS)
        .select('*')
        .in('category', categories)
        .eq('for_couples', true)
        .eq('is_active', true);
      
      if (qError || !questions?.length) {
        throw new Error('No questions available');
      }
      
      // Pick random question
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      // Create game session
      const today = new Date().toISOString().split('T')[0];
      const { data: newGame, error: createError } = await supabase
        .from(TABLES.GAMES)
        .insert({
          couple_id: couple.id,
          question_id: randomQuestion.id,
          game_date: today,
          status: 'waiting_both',
        })
        .select('*, question:question_id(*)')
        .single();
      
      if (createError) throw createError;
      
      setSession(newGame);
      setQuestion(newGame.question);
      setPhase('question');
      
    } catch (err) {
      console.error('Create game error:', err);
      setPhase('error');
      setErrorMessage('Failed to create game. Please try again.');
    }
  };

  const loadStreakData = async () => {
    if (!couple?.id) return;
    
    try {
      await refreshCoupleData();
      setCurrentStreak(couple?.current_streak || 0);
      setSyncScore(couple?.sync_score || 0);
    } catch (err) {
      console.error('Load streak error:', err);
    }
  };

  const handleAnswer = async (optionIndex: number) => {
    if (!session?.id || selectedOption !== null) return;
    
    setSelectedOption(optionIndex);
    
    try {
      const supabase = getSupabase();
      const answerField = isInitiator ? 'initiator_answer' : 'partner_answer';
      
      const { data: updatedGame, error } = await supabase
        .from(TABLES.GAMES)
        .update({ 
          [answerField]: optionIndex,
          [`${answerField.replace('_answer', '_answered_at')}`]: new Date().toISOString(),
        })
        .eq('id', session.id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Check if partner already answered
      const theirAnswer = isInitiator ? updatedGame.partner_answer : updatedGame.initiator_answer;
      
      if (theirAnswer !== null) {
        // Calculate match
        const matched = optionIndex === theirAnswer;
        
        // Update game status
        const { data: finalGame, error: updateError } = await supabase
          .from(TABLES.GAMES)
          .update({
            status: 'completed',
            is_match: matched,
            completed_at: new Date().toISOString(),
          })
          .eq('id', session.id)
          .select('*')
          .single();
        
        if (updateError) throw updateError;
        
        setPartnerOption(theirAnswer);
        setIsMatch(matched);
        setSession(finalGame);
        setPhase('reveal');
        
        // Haptic feedback
        if (matched) {
          hapticSuccess();
        } else {
          hapticError();
        }
        
      } else {
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
      color: themeColors.textMuted,
      marginTop: 16,
    },
    questionLabel: {
      ...typography.caption,
      color: themeColors.purple,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    errorTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 24,
      color: themeColors.textPrimary,
      marginTop: 16,
    },
    errorText: {
      ...typography.body,
      color: themeColors.textMuted,
      marginBottom: 24,
      textAlign: 'center' as const,
    },
    yourAnswerLabel: {
      ...typography.caption,
      color: themeColors.textMuted,
      marginBottom: 8,
    },
    yourAnswerText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 18,
      color: themeColors.textPrimary,
    },
    matchText: {
      fontFamily: fontFamilies.display,
      fontSize: 28,
    },
    revealQuestion: {
      ...typography.body,
      color: themeColors.textMuted,
      marginBottom: 16,
      textAlign: 'center' as const,
    },
    resultsLabel: {
      ...typography.caption,
      color: themeColors.textMuted,
      marginBottom: 8,
    },
    resultsTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 28,
      color: themeColors.textPrimary,
      marginBottom: 24,
    },
    resultLabel: {
      ...typography.caption,
      color: themeColors.textMuted,
      marginBottom: 6,
    },
    resultValue: {
      fontFamily: fontFamilies.bodyBold,
      fontSize: 22,
      color: themeColors.textPrimary,
    },
  };

  // Loading phase - use skeleton
  if (phase === 'loading') {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <QuestionSkeleton />
      </SafeAreaView>
    );
  }

  // Error phase
  if (phase === 'error') {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={dynamicStyles.errorTitle}>Oops!</Text>
          <Text style={dynamicStyles.errorText}>{errorMessage}</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {showConfetti && <Confetti />}
      {showBurst && <CelebrationBurst />}
      
      {/* Question Phase */}
      {phase === 'question' && question && (
        <View style={styles.gameContent}>
          <Text style={dynamicStyles.questionLabel}>DAILY SYNC</Text>
          <QuestionCard
            question={question.question}
            options={question.options}
            selectedOption={selectedOption}
            onSelectOption={handleAnswer}
            category={question.category as QuestionCategory}
          />
        </View>
      )}

      {/* Waiting Phase - Use new WaitingAnimation */}
      {phase === 'waiting' && question && (
        <View style={styles.centerContent}>
          <WaitingAnimation
            partnerName={connectionName}
            isPartnerOnline={partnerState === 'online' || partnerState === 'playing'}
            isPartnerPlaying={partnerState === 'playing' && partnerCurrentScreen === 'daily'}
          />
          
          <Card style={styles.yourAnswerCard} variant="elevated" padding="medium">
            <Text style={dynamicStyles.yourAnswerLabel}>YOUR ANSWER</Text>
            <Text style={dynamicStyles.yourAnswerText}>
              {question.options[selectedOption ?? 0]}
            </Text>
          </Card>
        </View>
      )}

      {/* Reveal Phase - Use new AnswerReveal */}
      {phase === 'reveal' && question && (
        <View style={styles.centerContent}>
          <AnswerReveal
            question={question.question}
            yourAnswer={question.options[selectedOption ?? 0]}
            partnerAnswer={question.options[partnerOption ?? 0]}
            partnerName={connectionName}
            isMatch={isMatch}
            onAnimationComplete={handleRevealComplete}
          />

          {revealAnimationComplete && (
            <View style={styles.footer}>
              <Button title="Continue" onPress={handleContinue} fullWidth />
            </View>
          )}
        </View>
      )}

      {/* Results Phase */}
      {phase === 'results' && (
        <View style={styles.centerContent}>
          <Text style={dynamicStyles.resultsLabel}>DAILY SYNC COMPLETE</Text>
          <Text style={dynamicStyles.resultsTitle}>
            {isMatch ? 'Nice work! 🎉' : 'Better luck tomorrow! 💕'}
          </Text>

          <Card style={styles.resultsCard} variant="elevated" padding="large">
            <View style={styles.resultsRow}>
              <View style={styles.resultItem}>
                <Text style={dynamicStyles.resultLabel}>STREAK</Text>
                <Text style={dynamicStyles.resultValue}>🔥 {currentStreak}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={dynamicStyles.resultLabel}>SYNC SCORE</Text>
                <SyncScoreRing score={syncScore} size={60} />
              </View>
            </View>
          </Card>

          <View style={styles.footer}>
            <Button title="Done" onPress={handleFinish} fullWidth />
          </View>
        </View>
      )}

      {/* Already Played Phase */}
      {phase === 'already_played' && question && (
        <View style={styles.centerContent}>
          <Text style={dynamicStyles.resultsLabel}>ALREADY PLAYED TODAY</Text>
          <Text style={dynamicStyles.resultsTitle}>
            {isMatch ? 'You matched! ✨' : 'You had different answers 💭'}
          </Text>

          <AnswerReveal
            question={question.question}
            yourAnswer={question.options[selectedOption ?? 0]}
            partnerAnswer={question.options[partnerOption ?? 0]}
            partnerName={connectionName}
            isMatch={isMatch}
          />

          <View style={styles.footer}>
            <Button title="Back to Home" onPress={handleFinish} fullWidth />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gameContent: {
    flex: 1,
    padding: 20,
  },
  errorEmoji: {
    fontSize: 64,
  },
  yourAnswerCard: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  resultsCard: {
    width: '100%',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  resultItem: {
    alignItems: 'center',
  },
  footer: {
    width: '100%',
    marginTop: 32,
  },
  pointsText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    marginTop: 16,
  },
});
