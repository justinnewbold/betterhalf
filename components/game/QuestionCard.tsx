import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../constants/colors';
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
};

const categoryLabels: Record<string, string> = {
  daily_life: 'Daily Life',
  heart: 'Heart',
  history: 'History',
  spice: 'Spice',
  fun: 'Fun',
};

export function QuestionCard({ question, selectedIndex, onSelectOption, disabled }: QuestionCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.category}>
          {categoryEmojis[question.category]} {categoryLabels[question.category]}
        </Text>
      </View>

      <Card style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question}</Text>
      </Card>

      <View style={styles.options}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedIndex === index && styles.optionSelected,
              disabled && styles.optionDisabled,
            ]}
            onPress={() => onSelectOption(index)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.optionText,
              selectedIndex === index && styles.optionTextSelected,
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
  category: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  questionCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  questionText: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
  },
  options: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
  },
  optionSelected: {
    backgroundColor: 'rgba(192,132,252,0.15)',
    borderColor: colors.purpleLight,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.purpleLight,
  },
});
