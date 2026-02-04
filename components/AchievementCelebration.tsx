import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing, TouchableOpacity, Dimensions } from 'react-native';
import { useAchievementStore } from '../stores/achievementStore';
import { useThemeStore } from '../stores/themeStore';
import { getThemeColors } from '../constants/colors';
import { typography, fontFamilies } from '../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Simple particle for celebration effect
function CelebrationParticle({ delay, startX }: { delay: number; startX: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const emojis = ['🎉', '⭐', '✨', '🏆', '💫', '🌟', '🎊', '💪'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  useEffect(() => {
    const xDrift = (Math.random() - 0.5) * 200;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          easing: Easing.back(2),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -300,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: xDrift,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          left: startX,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function AchievementCelebration() {
  const { newlyUnlocked, dismissCelebration } = useAchievementStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const badgeRotate = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const isVisible = newlyUnlocked.length > 0;
  const achievement = newlyUnlocked[0]?.achievement;

  useEffect(() => {
    if (isVisible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      badgeRotate.setValue(0);
      badgeScale.setValue(0);
      glowAnim.setValue(0);

      // Orchestrate entrance
      Animated.sequence([
        // Fade in backdrop
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Pop in card
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        // Badge entrance with spin
        Animated.parallel([
          Animated.spring(badgeScale, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(badgeRotate, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Pulsing glow loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isVisible]);

  if (!isVisible || !achievement) return null;

  const spin = badgeRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // Generate particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 100 + 500,
    startX: Math.random() * SCREEN_WIDTH * 0.6 + SCREEN_WIDTH * 0.2,
  }));

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={dismissCelebration}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Celebration particles */}
        {particles.map(p => (
          <CelebrationParticle key={p.id} delay={p.delay} startX={p.startX} />
        ))}

        <Animated.View
          style={[
            styles.card,
            { 
              backgroundColor: themeColors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glow ring behind badge */}
          <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />

          {/* Badge */}
          <Animated.View
            style={[
              styles.badgeContainer,
              {
                transform: [
                  { scale: badgeScale },
                  { rotate: spin },
                ],
              },
            ]}
          >
            <Text style={styles.badgeIcon}>{achievement.icon || '🏆'}</Text>
          </Animated.View>

          <Text style={[styles.unlockLabel, { color: themeColors.primary }]}>
            Achievement Unlocked!
          </Text>

          <Text style={[styles.achievementName, { color: themeColors.text }]}>
            {achievement.name}
          </Text>

          <Text style={[styles.achievementDesc, { color: themeColors.textSecondary }]}>
            {achievement.description}
          </Text>

          {newlyUnlocked.length > 1 && (
            <Text style={[styles.moreText, { color: themeColors.textMuted }]}>
              +{newlyUnlocked.length - 1} more achievement{newlyUnlocked.length > 2 ? 's' : ''} unlocked!
            </Text>
          )}

          <TouchableOpacity
            style={[styles.dismissButton, { backgroundColor: themeColors.primary }]}
            onPress={dismissCelebration}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissText}>Awesome! 🎉</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  glowRing: {
    position: 'absolute',
    top: 8,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  badgeContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  badgeIcon: {
    fontSize: 48,
  },
  unlockLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  achievementName: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDesc: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  moreText: {
    fontSize: 14,
    marginBottom: 8,
  },
  dismissButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  dismissText: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
    bottom: '40%',
  },
});

