import React, { useCallback, useRef } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { hapticPress } from '../../lib/haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  haptic?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  haptic = true,
}: ButtonProps) {
  // iOS-style scale animation
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleValue]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleValue]);

  const handlePress = useCallback(() => {
    if (haptic) {
      hapticPress();
    }
    onPress();
  }, [haptic, onPress]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 10, paddingHorizontal: 16, minHeight: 40 };
      case 'large':
        return { paddingVertical: 18, paddingHorizontal: 32, minHeight: 56 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24, minHeight: 48 };
    }
  };

  const getTextSize = () => {
    return size === 'small' ? typography.buttonSmall : typography.button;
  };

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Animated.View style={[
        fullWidth && styles.fullWidth, 
        style,
        { transform: [{ scale: scaleValue }] }
      ]}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={1}
          style={styles.touchable}
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityState={{ disabled: isDisabled, busy: loading }}
        >
          <LinearGradient
            colors={isDisabled ? ['#555', '#444'] : [colors.coral, colors.purpleLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, getSizeStyles(), styles.primaryButton]}
          >
            {loading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={[styles.text, getTextSize(), textStyle]}>{title}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      fullWidth && styles.fullWidth, 
      style,
      { transform: [{ scale: scaleValue }] }
    ]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.button,
          getSizeStyles(),
          variant === 'secondary' && styles.secondaryButton,
          variant === 'ghost' && styles.ghostButton,
          isDisabled && styles.disabled,
        ]}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' ? colors.textPrimary : colors.purple} />
        ) : (
          <Text
            style={[
              styles.text,
              getTextSize(),
              variant === 'secondary' && styles.secondaryText,
              variant === 'ghost' && styles.ghostText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // iOS-style shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  fullWidth: {
    width: '100%',
  },
  primaryButton: {
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
      web: { boxShadow: 'none' },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3, // iOS-style letter spacing
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  ghostText: {
    color: colors.purple,
  },
});
