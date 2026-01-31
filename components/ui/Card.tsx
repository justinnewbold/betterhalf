import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../stores/themeStore';
import { getThemeColors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'gradient' | 'success' | 'error';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={isDark 
          ? ['rgba(255,107,107,0.15)', 'rgba(192,132,252,0.15)']
          : ['rgba(232,85,85,0.1)', 'rgba(147,51,234,0.1)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card, 
          styles.gradientBorder, 
          { borderRadius: 16, padding: 16 },
          style
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  const baseStyle = {
    backgroundColor: themeColors.cardBackground,
    borderColor: themeColors.cardBorder,
  };

  const variantStyles = {
    default: [styles.card, baseStyle],
    success: [styles.card, baseStyle, styles.successCard],
    error: [styles.card, baseStyle, styles.errorCard],
  };

  return (
    <View style={[variantStyles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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