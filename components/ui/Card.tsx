import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gradient' | 'success' | 'error';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={['rgba(255,107,107,0.15)', 'rgba(192,132,252,0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.gradientBorder, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  const variantStyles = {
    default: styles.card,
    success: [styles.card, styles.successCard],
    error: [styles.card, styles.errorCard],
  };

  return (
    <View style={[variantStyles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardDarkBorder,
  },
  gradientBorder: {
    borderWidth: 0,
  },
  successCard: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
});
