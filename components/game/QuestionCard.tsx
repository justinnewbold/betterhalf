import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Card } from '../ui/Card';
import { useThemeStore } from '../../stores/themeStore';
import { getThemeColors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';
import { hapticSelection, hapticPress } from '../../lib/haptics';

interface QuestionCardProps {
  question: {
    id: string;
    question: string;
    options: string[];
    category: string;
  };
  selectedIndex?: number;
  onSelectOption: (index: number) => void;
  disabled?: boolean;
}

const categoryEmojis: Record<string, string> = {
  daily_life: '☀️',
  heart: '❤️',
  history: '📸',
  spice: '🔥',
  fun: '🎉',
  deep_talks: '💭',
  custom: '✨',
};

const categoryLabels: Record<string, string> = {
  daily_life: 'Daily Life',
  heart: 'Heart',
  history: 'History',
  spice: 'Spice',
  fun: 'Fun',
  deep_talks: 'Deep Talks',
  custom: 'Custom',
};

// Animated option button component
function OptionButton({ 
  option, 
  index, 
  isSelected, 
  onSelect, 
  disabled, 
  themeColors,
  isDark,
  animationDelay 
}: {
  option: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  themeColors: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  animationDelay: number;
}) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 300,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, []);

  const handlePress = useCallback(() => {
    hapticSelection();
    onSelect();
  }, [onSelect]);

  const dynamicOptionStyles = {
    button: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderWidth: 1.5,
      borderColor: isSelected 
        ? themeColors.purpleLight 
        : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
      borderRadius: 14,
      padding: 16,
      minHeight: 54,
      justifyContent: 'center' as const,
      // iOS-style shadow when selected
      ...(isSelected && Platform.select({
        ios: {
          shadowColor: themeColors.purpleLight,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: `0 2px 12px ${themeColors.purpleLight}40`,
        },
      })),
    },
    selectedBg: {
      backgroundColor: isDark ? 'rgba(192,132,252,0.12)' : 'rgba(147,51,234,0.08)',
    },
    text: {
      ...typography.body,
      color: isSelected ? themeColors.purpleLight : themeColors.textPrimary,
      fontWeight: isSelected ? '600' : '400' as any,
      letterSpacing: 0.2,
    },
  };

  return (
    <Animated.View
      style={{
        opacity: fadeValue,
        transform: [
          { translateY },
          { scale: scaleValue },
        ],
      }}
    >
      <TouchableOpacity
        style={[
          dynamicOptionStyles.button,
          isSelected && dynamicOptionStyles.selectedBg,
          disabled && styles.optionDisabled,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <Text style={dynamicOptionStyles.text}>{option}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function QuestionCard({ question, selectedIndex, onSelectOption, disabled }: QuestionCardProps) {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  
  // Question card entrance animation
  const questionFade = useRef(new Animated.Value(0)).current;
  const questionScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(questionFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(questionScale, {
        toValue: 1,
        speed: 12,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [question.id]);

  const dynamicStyles = {
    category: {
      ...typography.caption,
      color: themeColors.textMuted,
      textAlign: 'center' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      fontSize: 11,
    },
    questionText: {
      fontFamily: fontFamilies.display,
      fontSize: 24,
      color: themeColors.textPrimary,
      textAlign: 'center' as const,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={dynamicStyles.category}>
          {categoryEmojis[question.category] || '❓'} {categoryLabels[question.category] || question.category}
        </Text>
      </View>

      <Animated.View
        style={{
          opacity: questionFade,
          transform: [{ scale: questionScale }],
        }}
      >
        <Card style={styles.questionCard}>
          <Text style={dynamicStyles.questionText}>{question.question}</Text>
        </Card>
      </Animated.View>

      <View style={styles.options}>
        {question.options.map((option, index) => (
          <OptionButton
            key={`${question.id}-${index}`}
            option={option}
            index={index}
            isSelected={selectedIndex === index}
            onSelect={() => onSelectOption(index)}
            disabled={disabled}
            themeColors={themeColors}
            isDark={isDark}
            animationDelay={100 + index * 75}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  questionCard: {
    marginBottom: 28,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  options: {
    gap: 12,
  },
  optionDisabled: {
    opacity: 0.5,
  },
});
