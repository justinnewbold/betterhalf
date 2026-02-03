import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { getThemeColors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';

interface WaitingAnimationProps {
  partnerName: string;
  isPartnerOnline?: boolean;
  isPartnerPlaying?: boolean;
}

export function WaitingAnimation({ partnerName, isPartnerOnline, isPartnerPlaying }: WaitingAnimationProps) {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  
  // Pulsing animation for the icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Dot animations for "typing" effect
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle rotation if partner is playing
    if (isPartnerPlaying) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }

    // Dots animation
    const animateDots = () => {
      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animateDots();
  }, [isPartnerPlaying]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dynamicStyles = {
    container: {
      alignItems: 'center' as const,
      padding: 24,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDark ? 'rgba(168,85,247,0.12)' : 'rgba(147,51,234,0.08)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 24,
      // iOS blur-like effect
      ...Platform.select({
        ios: {
          shadowColor: themeColors.purple,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
        },
        web: {
          boxShadow: `0 4px 24px ${themeColors.purple}30`,
        },
      }),
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 24,
      color: themeColors.textPrimary,
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    subtitle: {
      ...typography.body,
      color: themeColors.textMuted,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    dotsContainer: {
      flexDirection: 'row' as const,
      gap: 6,
      marginTop: 16,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: themeColors.purple,
    },
    statusBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: isDark ? 'rgba(74,222,128,0.15)' : 'rgba(22,163,74,0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#4ADE80',
      marginRight: 8,
    },
    statusText: {
      ...typography.caption,
      color: '#4ADE80',
    },
  };

  const emoji = isPartnerPlaying ? '💭' : isPartnerOnline ? '👀' : '⏳';
  const statusMessage = isPartnerPlaying 
    ? `${partnerName} is answering...`
    : isPartnerOnline 
      ? `${partnerName} is online`
      : `Waiting for ${partnerName}`;

  return (
    <View style={dynamicStyles.container}>
      <Animated.View 
        style={[
          dynamicStyles.iconContainer,
          { 
            transform: [
              { scale: pulseAnim },
              ...(isPartnerPlaying ? [{ rotate: spin }] : []),
            ] 
          }
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>

      <Text style={dynamicStyles.title}>{statusMessage}</Text>
      
      <Text style={dynamicStyles.subtitle}>
        {isPartnerPlaying 
          ? "They're thinking about their answer"
          : "We'll let you know when they respond"}
      </Text>

      {/* Animated dots */}
      <View style={dynamicStyles.dotsContainer}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View 
            key={i}
            style={[
              dynamicStyles.dot, 
              { 
                opacity: dot,
                transform: [{ 
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  })
                }]
              }
            ]} 
          />
        ))}
      </View>

      {/* Online status badge */}
      {isPartnerOnline && (
        <View style={dynamicStyles.statusBadge}>
          <View style={dynamicStyles.statusDot} />
          <Text style={dynamicStyles.statusText}>Online now</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 48,
  },
});
