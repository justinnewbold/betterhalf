import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { QuestionCard } from '../../../components/game/QuestionCard';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SyncScoreRing } from '../../../components/game/SyncScoreRing';
import { useCoupleStore } from '../../../stores/coupleStore';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

// Demo question
const DEMO_QUESTION = {
  id: 'demo_1',
  category: 'daily_life',
  difficulty: 'easy',
  question: 'How do I take my coffee?',
  options: ['Black', 'With cream', 'Cream and sugar', "I don't drink coffee"],
};

type GamePhase = 'question' | 'waiting' | 'reveal' | 'results';

export default function DailySync() {
  const { partnerProfile } = useCoupleStore();
  const [phase, setPhase] = useState<GamePhase>('question');
  const [selectedOption, setSelectedOption] = useState<number | undefined>();
  const [partnerOption, setPartnerOption] = useState<number | undefined>();
  const [isMatch, setIsMatch] = useState(false);

  const partnerName = partnerProfile?.display_name || 'Partner';

  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
  };

  const handleLockIn = () => {
    if (selectedOption === undefined) return;
    
    // Simulate partner answering after a delay
    setPhase('waiting');
    
    setTimeout(() => {
      // Simulate partner's answer (random for demo)
      const partnerAnswer = Math.random() > 0.5 ? selectedOption : Math.floor(Math.random() * 4);
      setPartnerOption(partnerAnswer);
      setIsMatch(selectedOption === partnerAnswer);
      setPhase('reveal');
    }, 2000);
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
      {phase === 'question' && (
        <View style={styles.content}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>Question 1 of 1</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>

          <QuestionCard
            question={DEMO_QUESTION}
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
      {phase === 'waiting' && (
        <View style={styles.centerContent}>
          <View style={styles.waitingIcon}>
            <Text style={styles.waitingEmoji}>⏳</Text>
          </View>
          <Text style={styles.waitingTitle}>Waiting for {partnerName}</Text>
          <Text style={styles.waitingSubtitle}>They're still answering...</Text>
          
          <Card style={styles.yourAnswerCard}>
            <Text style={styles.yourAnswerLabel}>YOUR ANSWER</Text>
            <Text style={styles.yourAnswerText}>
              {DEMO_QUESTION.options[selectedOption || 0]}
            </Text>
          </Card>
        </View>
      )}

      {/* Reveal Phase */}
      {phase === 'reveal' && (
        <View style={styles.centerContent}>
          <View style={styles.matchIndicator}>
            <Text style={styles.matchEmoji}>{isMatch ? '✨' : '😅'}</Text>
            <Text style={[styles.matchText, isMatch ? styles.matchSuccess : styles.matchMiss]}>
              {isMatch ? "It's a Match!" : 'Not Quite!'}
            </Text>
          </View>

          <Card style={styles.revealCard}>
            <Text style={styles.revealQuestion}>{DEMO_QUESTION.question}</Text>
            
            <View style={styles.revealAnswers}>
              <View style={[styles.answerBox, isMatch && styles.answerMatch]}>
                <Text style={styles.answerName}>YOU</Text>
                <Text style={styles.answerValue}>
                  {DEMO_QUESTION.options[selectedOption || 0]}
                </Text>
              </View>
              <View style={[styles.answerBox, isMatch && styles.answerMatch]}>
                <Text style={styles.answerName}>{partnerName.toUpperCase()}</Text>
                <Text style={styles.answerValue}>
                  {DEMO_QUESTION.options[partnerOption || 0]}
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
          <Text style={styles.resultsTitle}>Nice work! 🎉</Text>

          <SyncScoreRing percentage={isMatch ? 71 : 68} size="medium" />

          <Card style={styles.resultsCard}>
            <View style={styles.resultsRow}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>STREAK</Text>
                <Text style={styles.resultValue}>🔥 8</Text>
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
            <Button title="Back to Home" onPress={handleContinue} fullWidth />
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
