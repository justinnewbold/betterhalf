import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../stores/themeStore';
import { getThemeColors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'gradient' | 'success' | 'error' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const paddingValues = {
  none: 0,
  small: 12,
  medium: 16,
  large: 24,
};

export function Card({ children, style, variant = 'default', padding = 'medium' }: CardProps) {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

  const basePadding = paddingValues[padding];

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
          { borderRadius: 16, padding: basePadding },
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
    padding: basePadding,
  };

  // iOS-style elevated card with subtle shadow
  const elevatedStyle = Platform.select({
    ios: {
      shadowColor: isDark ? '#000' : '#666',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: isDark 
        ? '0 4px 20px rgba(0,0,0,0.4)' 
        : '0 4px 20px rgba(0,0,0,0.08)',
    },
  });

  const variantStyles: Record<string, ViewStyle[]> = {
    default: [styles.card, baseStyle as ViewStyle],
    elevated: [styles.card, baseStyle as ViewStyle, elevatedStyle as ViewStyle],
    success: [styles.card, baseStyle as ViewStyle, styles.successCard],
    error: [styles.card, baseStyle as ViewStyle, styles.errorCard],
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
    borderWidth: 1,
    // Subtle transition feel
    overflow: 'hidden',
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
