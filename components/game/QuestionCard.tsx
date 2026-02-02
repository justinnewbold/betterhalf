import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { useThemeStore } from '../../stores/themeStore';
import { getThemeColors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';

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

export function QuestionCard({ question, selectedIndex, onSelectOption, disabled }: QuestionCardProps) {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

  const dynamicStyles = {
    category: {
      ...typography.caption,
      color: themeColors.textMuted,
      textAlign: 'center' as const,
    },
    questionText: {
      fontFamily: fontFamilies.display,
      fontSize: 22,
      color: themeColors.textPrimary,
      textAlign: 'center' as const,
      lineHeight: 30,
    },
    optionButton: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
      borderRadius: 12,
      padding: 16,
    },
    optionSelected: {
      backgroundColor: isDark ? 'rgba(192,132,252,0.15)' : 'rgba(147,51,234,0.12)',
      borderColor: themeColors.purpleLight,
    },
    optionText: {
      ...typography.body,
      color: themeColors.textPrimary,
    },
    optionTextSelected: {
      color: themeColors.purpleLight,
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={dynamicStyles.category}>
          {categoryEmojis[question.category] || '❓'} {categoryLabels[question.category] || question.category}
        </Text>
      </View>

      <Card style={styles.questionCard}>
        <Text style={dynamicStyles.questionText}>{question.question}</Text>
      </Card>

      <View style={styles.options}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              dynamicStyles.optionButton,
              selectedIndex === index && dynamicStyles.optionSelected,
              disabled && styles.optionDisabled,
            ]}
            onPress={() => onSelectOption(index)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={[
              dynamicStyles.optionText,
              selectedIndex === index && dynamicStyles.optionTextSelected,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
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
    marginBottom: 12,
  },
  questionCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  options: {
    gap: 12,
  },
  optionDisabled: {
    opacity: 0.5,
  },
});
