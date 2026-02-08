import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePresenceStore } from '../../stores/presenceStore';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface PartnerStatusProps {
  partnerName: string;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

export function PartnerStatus({ partnerName, size = 'small', showLabel = true }: PartnerStatusProps) {
  const { partnerState, partnerCurrentScreen, partnerLastSeen } = usePresenceStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for active states
  useEffect(() => {
    if (partnerState === 'online' || partnerState === 'playing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [partnerState]);

  const getStatusColor = () => {
    switch (partnerState) {
      case 'online':
        return '#4ADE80';
      case 'playing':
        return '#F472B6';
      case 'away':
        return '#FBBF24';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (partnerState) {
      case 'online':
        return 'Online now';
      case 'playing':
        if (partnerCurrentScreen === 'daily') {
          return 'Answering question...';
        }
        return 'In the app';
      case 'away':
        return 'Away';
      default:
        if (partnerLastSeen) {
          return getLastSeenText();
        }
        return 'Offline';
    }
  };

  const getLastSeenText = () => {
    if (!partnerLastSeen) return 'Offline';
    
    const lastSeen = new Date(partnerLastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const dotSize = size === 'small' ? 8 : 10;
  const isActive = partnerState === 'online' || partnerState === 'playing';

  return (
    <View style={styles.container} accessibilityLabel={`${partnerName}: ${getStatusText()}`} accessibilityRole="text">
      <View style={[styles.statusDot, { width: dotSize + 6, height: dotSize + 6 }]}>
        {isActive && (
          <Animated.View 
            style={[
              styles.pulse, 
              { 
                backgroundColor: getStatusColor(),
                width: dotSize + 6,
                height: dotSize + 6,
                borderRadius: (dotSize + 6) / 2,
                opacity: 0.4,
                transform: [{ scale: pulseAnim }],
              }
            ]} 
          />
        )}
        <View 
          style={[
            styles.dotInner, 
            { 
              backgroundColor: getStatusColor(),
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
            }
          ]} 
        />
      </View>
      {showLabel && (
        <Text style={[styles.statusText, size === 'medium' && styles.statusTextMedium]}>
          {getStatusText()}
        </Text>
      )}
    </View>
  );
}

export function PartnerAnsweringIndicator({ partnerName }: { partnerName: string }) {
  const { partnerState, partnerCurrentScreen } = usePresenceStore();
  
  const isAnswering = partnerState === 'playing' && partnerCurrentScreen === 'daily';
  
  if (!isAnswering) return null;

  return (
    <LinearGradient
      colors={['rgba(244,114,182,0.15)', 'rgba(192,132,252,0.15)']}
      style={styles.answeringBadge}
    >
      <View style={styles.answeringDot} />
      <Text style={styles.answeringText}>
        {partnerName} is answering...
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotInner: {
    position: 'absolute',
    zIndex: 2,
  },
  pulse: {
    position: 'absolute',
    zIndex: 1,
  },
  statusText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusTextMedium: {
    fontSize: 14,
  },
  answeringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 8,
  },
  answeringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F472B6',
  },
  answeringText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F472B6',
  },
});
