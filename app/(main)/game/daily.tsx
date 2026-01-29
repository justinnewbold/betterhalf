import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuestionCard } from '../../../components/game/QuestionCard';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SyncScoreRing } from '../../../components/game/SyncScoreRing';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { usePresenceStore } from '../../../stores/presenceStore';
import { PartnerAnsweringIndicator } from '../../../components/ui/PartnerStatus';
import { getSupabase, TABLES } from '../../../lib/supabase';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

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
  couple_id: string;
  question_id: string;
  user_a_answer: number | null;
  user_b_answer: number | null;
  is_match: boolean | null;
  completed_at: string | null;
  created_at: string;
}

export default function DailySync() {
  const { user } = useAuthStore();
  const { couple, partnerProfile, streak: streakData, fetchCouple } = useCoupleStore();
  const { updateMyState, partnerState, partnerCurrentScreen } = usePresenceStore();
  
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [question, setQuestion] = useState<Question | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | undefined>();
  const [partnerOption, setPartnerOption] = useState<number | undefined>();
  const [isMatch, setIsMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncScore, setSyncScore] = useState(0);
  const [todayStats, setTodayStats] = useState({ matched: 0, total: 1 });

  const partnerName = partnerProfile?.display_name || 'Partner';
  const isPartnerA = couple?.partner_a_id === user?.id;

  // Update presence when entering/leaving game
  useEffect(() => {
    updateMyState('playing', 'daily');
    return () => {
      updateMyState('online', 'home');
    };
  }, []);

  // Load or create today's game session
  useEffect(() => {
    loadTodaySession();
  }, [couple?.id, user?.id]);

  // Poll for partner's answer when waiting
  useEffect(() => {
    if (phase !== 'waiting' || !session?.id) return;
    
    const interval = setInterval(async () => {
      await checkPartnerAnswer();
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [phase, session?.id]);

  const loadTodaySession = async () => {
    const supabase = getSupabase();
    if (!supabase || !couple?.id || !user?.id) {
      setPhase('error');
      setError('Not connected');
      return;
    }

    try {
      // Get today's date (start of day in UTC)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Check for existing session today
      const { data: existingSession, error: sessionError } = await supabase
        .from('betterhalf_daily_sessions')
        .select('*, question:betterhalf_questions(*)')
        .eq('couple_id', couple.id)
        .gte('created_at', todayISO)
        .maybeSingle();

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.error('[DailySync] Session error:', sessionError);
        throw sessionError;
      }

      if (existingSession) {
        console.log('[DailySync] Found existing session:', existingSession.id);
        setSession(existingSession);
        setQuestion(existingSession.question);
        
        // Determine current state based on answers
        const myAnswer = isPartnerA ? existingSession.user_a_answer : existingSession.user_b_answer;
        const theirAnswer = isPartnerA ? existingSession.user_b_answer : existingSession.user_a_answer;
        
        if (existingSession.completed_at) {
          // Game already completed - show results
          setSelectedOption(myAnswer ?? undefined);
          setPartnerOption(theirAnswer ?? undefined);
          setIsMatch(existingSession.is_match ?? false);
          setPhase('already_played');
        } else if (myAnswer !== null && theirAnswer !== null) {
          // Both answered - show reveal
          setSelectedOption(myAnswer);
          setPartnerOption(theirAnswer);
          setIsMatch(myAnswer === theirAnswer);
          setPhase('reveal');
        } else if (myAnswer !== null) {
          // I answered, waiting for partner
          setSelectedOption(myAnswer);
          setPhase('waiting');
        } else {
          // Haven't answered yet
          setPhase('question');
        }
      } else {
        // Create new session with a random question
        console.log('[DailySync] Creating new session');
        await createNewSession();
      }
    } catch (err: any) {
      console.error('[DailySync] Error:', err);
      setError(err.message || 'Failed to load game');
      setPhase('error');
    }
  };

  const createNewSession = async () => {
    const supabase = getSupabase();
    if (!supabase || !couple?.id) return;

    try {
      // Get a random question
      const { data: questions, error: qError } = await supabase
        .from(TABLES.questions)
        .select('*')
        .eq('is_active', true)
        .limit(50);

      if (qError) throw qError;
      if (!questions || questions.length === 0) {
        setError('No questions available');
        setPhase('error');
        return;
      }

      // Pick random question
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      // Create session
      const { data: newSession, error: createError } = await supabase
        .from('betterhalf_daily_sessions')
        .insert({
          couple_id: couple.id,
          question_id: randomQuestion.id,
        })
        .select('*, question:betterhalf_questions(*)')
        .single();

      if (createError) throw createError;

      console.log('[DailySync] Created session:', newSession.id);
      setSession(newSession);
      setQuestion(newSession.question);
      setPhase('question');
    } catch (err: any) {
      console.error('[DailySync] Create session error:', err);
      setError(err.message || 'Failed to create game');
      setPhase('error');
    }
  };

  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
  };

  const handleLockIn = async () => {
    if (selectedOption === undefined || !session?.id) return;
    
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const updateField = isPartnerA ? 'user_a_answer' : 'user_b_answer';
      
      const { data: updated, error } = await supabase
        .from('betterhalf_daily_sessions')
        .update({ [updateField]: selectedOption })
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;

      setSession(updated);
      
      // Check if partner already answered
      const theirAnswer = isPartnerA ? updated.user_b_answer : updated.user_a_answer;
      
      if (theirAnswer !== null) {
        // Partner already answered - go to reveal
        setPartnerOption(theirAnswer);
        setIsMatch(selectedOption === theirAnswer);
        await completeGame(selectedOption === theirAnswer);
        setPhase('reveal');
      } else {
        // Wait for partner
        setPhase('waiting');
      }
    } catch (err: any) {
      console.error('[DailySync] Submit error:', err);
      setError(err.message || 'Failed to submit answer');
    }
  };

  const checkPartnerAnswer = async () => {
    const supabase = getSupabase();
    if (!supabase || !session?.id) return;

    try {
      const { data: updated, error } = await supabase
        .from('betterhalf_daily_sessions')
        .select()
        .eq('id', session.id)
        .single();

      if (error) throw error;

      const theirAnswer = isPartnerA ? updated.user_b_answer : updated.user_a_answer;
      
      if (theirAnswer !== null && selectedOption !== undefined) {
        // Partner answered!
        setPartnerOption(theirAnswer);
        const matched = selectedOption === theirAnswer;
        setIsMatch(matched);
        await completeGame(matched);
        setPhase('reveal');
      }
    } catch (err) {
      console.error('[DailySync] Check partner error:', err);
    }
  };

  const completeGame = async (matched: boolean) => {
    const supabase = getSupabase();
    if (!supabase || !session?.id || !couple?.id) return;

    try {
      // Mark session complete
      await supabase
        .from('betterhalf_daily_sessions')
        .update({
          is_match: matched,
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      // Update streak
      const { data: currentStreak } = await supabase
        .from(TABLES.streaks)
        .select('*')
        .eq('couple_id', couple.id)
        .maybeSingle();

      if (currentStreak) {
        const lastPlayed = currentStreak.last_played_at ? new Date(currentStreak.last_played_at) : null;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let newStreak = 1;
        if (lastPlayed && lastPlayed.toDateString() === yesterday.toDateString()) {
          // Played yesterday - continue streak
          newStreak = currentStreak.current_streak + 1;
        } else if (lastPlayed && lastPlayed.toDateString() === today.toDateString()) {
          // Already played today
          newStreak = currentStreak.current_streak;
        }
        
        await supabase
          .from(TABLES.streaks)
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, currentStreak.longest_streak),
            last_played_at: new Date().toISOString(),
          })
          .eq('couple_id', couple.id);
      }

      // Update couple stats
      const { data: stats } = await supabase
        .from(TABLES.couple_stats)
        .select('*')
        .eq('couple_id', couple.id)
        .maybeSingle();

      if (stats) {
        await supabase
          .from(TABLES.couple_stats)
          .update({
            total_games: stats.total_games + 1,
            total_questions: stats.total_questions + 1,
            total_matches: stats.total_matches + (matched ? 1 : 0),
            sync_score: Math.round(((stats.total_matches + (matched ? 1 : 0)) / (stats.total_questions + 1)) * 100),
          })
          .eq('couple_id', couple.id);
      }

      // Refresh couple data
      if (user?.id) {
        await fetchCouple(user.id);
      }
    } catch (err) {
      console.error('[DailySync] Complete game error:', err);
    }
  };

  const handleContinue = () => {
    if (phase === 'reveal') {
      setPhase('results');
    } else {
      router.back();
    }
  };

  const handleClose = () => {
    router.back();
  };

  // Calculate stats for results
  const currentStreak = streakData?.current_streak || 0;

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={styles.loadingText}>Loading today's question...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Sync</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
          <Button title="Try Again" onPress={loadTodaySession} />
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'already_played') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Sync</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.resultsLabel}>TODAY'S SYNC COMPLETE</Text>
          <Text style={styles.resultsTitle}>
            {isMatch ? 'You matched! 🎉' : 'Come back tomorrow! 💕'}
          </Text>
          
          {question && (
            <Card style={styles.revealCard}>
              <Text style={styles.revealQuestion}>{question.question}</Text>
              <View style={styles.revealAnswers}>
                <View style={[styles.answerBox, isMatch && styles.answerMatch]}>
                  <Text style={styles.answerName}>YOU</Text>
                  <Text style={styles.answerValue}>
                    {question.options[selectedOption ?? 0]}
                  </Text>
                </View>
                <View style={[styles.answerBox, isMatch && styles.answerMatch]}>
                  <Text style={styles.answerName}>{partnerName.toUpperCase()}</Text>
                  <Text style={styles.answerValue}>
                    {question.options[partnerOption ?? 0]}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          <View style={styles.footer}>
            <Button title="Back to Home" onPress={handleClose} fullWidth />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Sync</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Question Phase */}
      {phase === 'question' && question && (
        <View style={styles.content}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>Today's Question</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>

          <QuestionCard
            question={question}
            selectedIndex={selectedOption}
            onSelectOption={handleSelectOption}
          />

          <View style={styles.footer}>
            <Button
              title="Lock In Answer"
              onPress={handleLockIn}
              disabled={selectedOption === undefined}
              fullWidth
            />
          </View>
        </View>
      )}

      {/* Waiting Phase */}
      {phase === 'waiting' && question && (
        <View style={styles.centerContent}>
          <View style={styles.waitingIcon}>
            <Text style={styles.waitingEmoji}>
              {partnerState === 'playing' && partnerCurrentScreen === 'daily' ? '💭' : '⏳'}
            </Text>
          </View>
          <Text style={styles.waitingTitle}>Waiting for {partnerName}</Text>
          {partnerState === 'playing' && partnerCurrentScreen === 'daily' ? (
            <PartnerAnsweringIndicator partnerName={partnerName} />
          ) : (
            <Text style={styles.waitingSubtitle}>
              {partnerState === 'online' ? "They're online but haven't started yet" : "We'll notify you when they answer"}
            </Text>
          )}
          
          <Card style={styles.yourAnswerCard}>
            <Text style={styles.yourAnswerLabel}>YOUR ANSWER</Text>
            <Text style={styles.yourAnswerText}>
              {question.options[selectedOption ?? 0]}
            </Text>
          </Card>
        </View>
      )}

      {/* Reveal Phase */}
      {phase === 'reveal' && question && (
        <View style={styles.centerContent}>
          <View style={styles.matchIndicator}>
            <Text style={styles.matchEmoji}>{isMatch ? '✨' : '😅'}</Text>
            <Text style={[styles.matchText, isMatch ? styles.matchSuccess : styles.matchMiss]}>
              {isMatch ? "It's a Match!" : 'Not Quite!'}
            </Text>
          </View>

          <Card style={styles.revealCard}>
            <Text style={styles.revealQuestion}>{question.question}</Text>
            
            <View style={styles.revealAnswers}>
              <View style={[styles.answerBox, isMatch && styles.answerMatch]}>
                <Text style={styles.answerName}>YOU</Text>
                <Text style={styles.answerValue}>
                  {question.options[selectedOption ?? 0]}
                </Text>
              </View>
              <View style={[styles.answerBox, isMatch && styles.answerMatch]}>
                <Text style={styles.answerName}>{partnerName.toUpperCase()}</Text>
                <Text style={styles.answerValue}>
                  {question.options[partnerOption ?? 0]}
                </Text>
              </View>
            </View>
          </Card>

          <Text style={[styles.pointsText, isMatch ? styles.pointsSuccess : styles.pointsMiss]}>
            {isMatch ? '+10 points' : 'Time for a conversation? 😏'}
          </Text>

          <View style={styles.footer}>
            <Button title="Continue" onPress={handleContinue} fullWidth />
          </View>
        </View>
      )}

      {/* Results Phase */}
      {phase === 'results' && (
        <View style={styles.centerContent}>
          <Text style={styles.resultsLabel}>DAILY SYNC COMPLETE</Text>
          <Text style={styles.resultsTitle}>
            {isMatch ? 'Nice work! 🎉' : 'Better luck tomorrow! 💕'}
          </Text>

          <Card style={styles.resultsCard}>
            <View style={styles.resultsRow}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>STREAK</Text>
                <Text style={styles.resultValue}>🔥 {currentStreak}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>MATCHED</Text>
                <Text style={styles.resultValue}>{isMatch ? '1/1' : '0/1'}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>POINTS</Text>
                <Text style={styles.resultValue}>{isMatch ? '+10' : '+0'}</Text>
              </View>
            </View>
          </Card>

          <View style={styles.footer}>
            <Button title="Back to Home" onPress={handleClose} fullWidth />
          </View>
        </View>
      )}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressInfo: {
    marginBottom: 8,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.purpleLight,
    borderRadius: 2,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 16,
  },
  errorEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorText: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 24,
    textAlign: 'center',
  },
  waitingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  waitingEmoji: {
    fontSize: 48,
  },
  waitingTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  waitingSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 40,
  },
  yourAnswerCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  yourAnswerLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
  },
  yourAnswerText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  matchIndicator: {
    alignItems: 'center',
    marginBottom: 24,
  },
  matchEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  matchText: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
  },
  matchSuccess: {
    color: colors.success,
  },
  matchMiss: {
    color: colors.coral,
  },
  revealCard: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  revealQuestion: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  revealAnswers: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  answerBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.coral,
  },
  answerMatch: {
    borderColor: colors.success,
  },
  answerName: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 6,
  },
  answerValue: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pointsText: {
    ...typography.body,
    marginBottom: 40,
  },
  pointsSuccess: {
    color: colors.success,
  },
  pointsMiss: {
    color: colors.textMuted,
  },
  resultsLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
  },
  resultsTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  resultsCard: {
    width: '100%',
    marginTop: 24,
    marginBottom: 40,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resultItem: {
    alignItems: 'center',
  },
  resultLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 6,
  },
  resultValue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 22,
    color: colors.textPrimary,
  },
});
