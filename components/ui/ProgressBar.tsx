import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Platform } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { getThemeColors } from '../../constants/colors';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({ 
  progress, 
  height = 6,
  backgroundColor,
  fillColor,
  animated = true,
  style 
}: ProgressBarProps) {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const bgColor = backgroundColor || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)');
  const fill = fillColor || themeColors.purple;

  useEffect(() => {
    if (animated) {
      Animated.spring(animatedWidth, {
        toValue: progress,
        speed: 12,
        bounciness: 4,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, animated]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { height, backgroundColor: bgColor, borderRadius: height / 2 }, style]}>
      <Animated.View 
        style={[
          styles.fill, 
          { 
            width,
            height,
            backgroundColor: fill,
            borderRadius: height / 2,
            ...Platform.select({
              ios: {
                shadowColor: fill,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
              },
              android: {
                elevation: 2,
              },
            }),
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
