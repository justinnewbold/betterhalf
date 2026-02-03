import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const { isDark } = useThemeStore();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const baseColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const shimmerColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  return (
    <View 
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: shimmerColor,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

export function QuestionSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.header}>
        <Skeleton width={100} height={16} borderRadius={8} />
      </View>
      <View style={skeletonStyles.questionCard}>
        <Skeleton width="90%" height={24} style={{ marginBottom: 12 }} />
        <Skeleton width="70%" height={24} />
      </View>
      <View style={skeletonStyles.options}>
        <Skeleton height={54} borderRadius={14} style={{ marginBottom: 12 }} />
        <Skeleton height={54} borderRadius={14} style={{ marginBottom: 12 }} />
        <Skeleton height={54} borderRadius={14} style={{ marginBottom: 12 }} />
        <Skeleton height={54} borderRadius={14} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={skeletonStyles.profileContainer}>
      <Skeleton width={100} height={100} borderRadius={50} style={{ marginBottom: 16 }} />
      <Skeleton width={150} height={24} style={{ marginBottom: 8 }} />
      <Skeleton width={100} height={16} />
    </View>
  );
}

export function CardSkeleton() {
  return (
    <View style={skeletonStyles.cardContainer}>
      <Skeleton width="60%" height={20} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={16} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 24,
  },
  questionCard: { 
    padding: 24, 
    alignItems: 'center', 
    marginBottom: 32,
  },
  options: { 
    gap: 12,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    padding: 16,
  },
});
