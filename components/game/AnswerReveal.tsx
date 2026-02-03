import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { getThemeColors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';
import { hapticSuccess, hapticError } from '../../lib/haptics';

interface AnswerRevealProps {
  question: string;
  yourAnswer: string;
  partnerAnswer: string;
  partnerName: string;
  isMatch: boolean;
  onAnimationComplete?: () => void;
}

export function AnswerReveal({ 
  question, 
  yourAnswer, 
  partnerAnswer, 
  partnerName, 
  isMatch,
  onAnimationComplete 
}: AnswerRevealProps) {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

  // Animation values
  const matchScale = useRef(new Animated.Value(0)).current;
  const matchOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const yourAnswerSlide = useRef(new Animated.Value(-50)).current;
  const partnerAnswerSlide = useRef(new Animated.Value(50)).current;
  const yourAnswerOpacity = useRef(new Animated.Value(0)).current;
  const partnerAnswerOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // 1. Fade in the card
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 2. Slide in your answer from left
      Animated.parallel([
        Animated.spring(yourAnswerSlide, {
          toValue: 0,
          speed: 12,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(yourAnswerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // 3. Brief pause
      Animated.delay(400),
      // 4. Slide in partner answer from right
      Animated.parallel([
        Animated.spring(partnerAnswerSlide, {
          toValue: 0,
          speed: 12,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(partnerAnswerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // 5. Brief pause before result
      Animated.delay(300),
      // 6. Show match/mismatch result with haptics
      Animated.parallel([
        Animated.spring(matchScale, {
          toValue: 1,
          speed: 8,
          bounciness: 12,
          useNativeDriver: true,
        }),
        Animated.timing(matchOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Glow effect for match
        ...(isMatch ? [
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ] : []),
      ]),
    ]).start(() => {
      // Trigger haptic feedback
      if (isMatch) {
        hapticSuccess();
      } else {
        hapticError();
      }
      onAnimationComplete?.();
    });
  }, []);

  const dynamicStyles = {
    container: {
      alignItems: 'center' as const,
      width: '100%' as const,
    },
    matchIndicator: {
      alignItems: 'center' as const,
      marginBottom: 24,
    },
    matchText: {
      fontFamily: fontFamilies.display,
      fontSize: 32,
      color: isMatch ? themeColors.success : themeColors.coral,
      textAlign: 'center' as const,
    },
    card: {
      width: '100%' as const,
      backgroundColor: themeColors.cardBackground,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: isMatch ? themeColors.success : themeColors.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: isMatch ? themeColors.success : '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isMatch ? 0.3 : 0.15,
          shadowRadius: 16,
        },
        web: {
          boxShadow: isMatch 
            ? `0 8px 32px ${themeColors.success}40`
            : '0 8px 32px rgba(0,0,0,0.15)',
        },
      }),
    },
    questionText: {
      ...typography.body,
      color: themeColors.textMuted,
      textAlign: 'center' as const,
      marginBottom: 24,
      fontStyle: 'italic' as const,
    },
    answersContainer: {
      flexDirection: 'row' as const,
      gap: 16,
    },
    answerBox: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center' as const,
      borderWidth: 2,
      borderColor: isMatch ? themeColors.success : themeColors.coral,
    },
    answerLabel: {
      ...typography.caption,
      color: themeColors.textMuted,
      marginBottom: 8,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    answerText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: themeColors.textPrimary,
      textAlign: 'center' as const,
      lineHeight: 22,
    },
    glow: {
      position: 'absolute' as const,
      top: -20,
      left: -20,
      right: -20,
      bottom: -20,
      borderRadius: 30,
      backgroundColor: themeColors.success,
    },
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Match/Mismatch Indicator */}
      <Animated.View 
        style={[
          dynamicStyles.matchIndicator,
          {
            opacity: matchOpacity,
            transform: [{ scale: matchScale }],
          }
        ]}
      >
        <Text style={styles.matchEmoji}>{isMatch ? '✨' : '💭'}</Text>
        <Text style={dynamicStyles.matchText}>
          {isMatch ? "Perfect Match!" : "Different Vibes"}
        </Text>
      </Animated.View>

      {/* Answer Card */}
      <Animated.View style={[dynamicStyles.card, { opacity: cardOpacity }]}>
        {/* Glow effect for match */}
        {isMatch && (
          <Animated.View 
            style={[
              dynamicStyles.glow,
              { opacity: Animated.multiply(glowOpacity, 0.1) }
            ]} 
          />
        )}

        <Text style={dynamicStyles.questionText}>"{question}"</Text>

        <View style={dynamicStyles.answersContainer}>
          {/* Your Answer */}
          <Animated.View 
            style={[
              dynamicStyles.answerBox,
              {
                opacity: yourAnswerOpacity,
                transform: [{ translateX: yourAnswerSlide }],
              }
            ]}
          >
            <Text style={dynamicStyles.answerLabel}>You</Text>
            <Text style={dynamicStyles.answerText}>{yourAnswer}</Text>
          </Animated.View>

          {/* Partner Answer */}
          <Animated.View 
            style={[
              dynamicStyles.answerBox,
              {
                opacity: partnerAnswerOpacity,
                transform: [{ translateX: partnerAnswerSlide }],
              }
            ]}
          >
            <Text style={dynamicStyles.answerLabel}>{partnerName}</Text>
            <Text style={dynamicStyles.answerText}>{partnerAnswer}</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  matchEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
});
