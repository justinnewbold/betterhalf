import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing, Platform } from 'react-native';
import { hapticSuccess } from '../../lib/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'star';
}

interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
  autoStart?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  '#FF6B6B', // coral
  '#C084FC', // purple
  '#F472B6', // pink
  '#4ADE80', // green
  '#FBBF24', // yellow
  '#60A5FA', // blue
  '#F97316', // orange
  '#E879F9', // fuchsia
  '#22D3EE', // cyan
];

const INTENSITY_CONFIG = {
  light: { count: 30, duration: 2500 },
  medium: { count: 50, duration: 3000 },
  heavy: { count: 80, duration: 4000 },
};

export function Confetti({ 
  count,
  duration,
  colors = DEFAULT_COLORS,
  autoStart = true,
  intensity = 'medium',
  onComplete,
}: ConfettiProps) {
  const config = INTENSITY_CONFIG[intensity];
  const finalCount = count ?? config.count;
  const finalDuration = duration ?? config.duration;
  
  const pieces = useRef<ConfettiPiece[]>([]);
  const animationsStarted = useRef(false);

  // Initialize confetti pieces
  useEffect(() => {
    const shapes: Array<'square' | 'circle' | 'star'> = ['square', 'circle', 'star'];
    
    pieces.current = Array.from({ length: finalCount }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-50 - Math.random() * 150),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0.3 + Math.random() * 0.7),
      opacity: new Animated.Value(1),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 10,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
  }, [finalCount, colors]);

  useEffect(() => {
    if (autoStart && !animationsStarted.current) {
      startAnimation();
      animationsStarted.current = true;
      
      // Trigger haptic on confetti start
      hapticSuccess();
    }
  }, [autoStart]);

  const startAnimation = () => {
    const animations = pieces.current.map((piece, index) => {
      const delay = index * 20; // Stagger each piece
      const horizontalDrift = (Math.random() - 0.5) * 300;
      const wobbleAmount = 20 + Math.random() * 40;
      
      return Animated.parallel([
        // Fall down with slight curve
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 100,
          duration: finalDuration + Math.random() * 1500,
          delay,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        // Horizontal drift with wobble
        Animated.sequence([
          Animated.timing(piece.x, {
            toValue: piece.x._value + horizontalDrift,
            duration: finalDuration / 3,
            delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: piece.x._value + horizontalDrift + wobbleAmount,
            duration: finalDuration / 3,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: piece.x._value + horizontalDrift - wobbleAmount,
            duration: finalDuration / 3,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        // Continuous rotation
        Animated.loop(
          Animated.timing(piece.rotate, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration: 1000 + Math.random() * 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          { iterations: Math.ceil(finalDuration / 1000) }
        ),
        // Fade out at the end
        Animated.sequence([
          Animated.delay(delay + finalDuration * 0.7),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: finalDuration * 0.3,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });
  };

  const getShapeStyle = (shape: 'square' | 'circle' | 'star', size: number) => {
    switch (shape) {
      case 'circle':
        return { borderRadius: size / 2 };
      case 'star':
        // Simple approximation - actually still a rotated square
        return { borderRadius: 2, transform: [{ rotate: '45deg' }] };
      default:
        return { borderRadius: 2 };
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.current.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.piece,
            getShapeStyle(piece.shape, piece.size),
            {
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                { rotate: piece.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })
                },
                { scale: piece.scale },
              ],
              opacity: piece.opacity,
              ...Platform.select({
                ios: {
                  shadowColor: piece.color,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                },
                android: {
                  elevation: 2,
                },
                web: {
                  boxShadow: `0 1px 3px ${piece.color}40`,
                },
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

// Celebration burst - centered explosion effect
interface CelebrationBurstProps {
  particleCount?: number;
  duration?: number;
  colors?: string[];
}

export function CelebrationBurst({
  particleCount = 24,
  duration = 800,
  colors = DEFAULT_COLORS,
}: CelebrationBurstProps) {
  const particles = useRef<Array<{
    x: Animated.Value;
    y: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
    color: string;
    angle: number;
    distance: number;
  }>>([]);

  useEffect(() => {
    // Create particles in a circular pattern
    particles.current = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      
      return {
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: colors[Math.floor(Math.random() * colors.length)],
        angle,
        distance,
      };
    });

    // Start burst animation
    const animations = particles.current.map((particle) => {
      const targetX = Math.cos(particle.angle) * particle.distance;
      const targetY = Math.sin(particle.angle) * particle.distance;
      
      return Animated.parallel([
        Animated.spring(particle.x, {
          toValue: targetX,
          speed: 20,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(particle.y, {
          toValue: targetY,
          speed: 20,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(particle.scale, {
            toValue: 1,
            speed: 30,
            bounciness: 12,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: duration * 0.4,
            delay: duration * 0.4,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: duration,
          delay: duration * 0.3,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
    
    // Haptic feedback
    hapticSuccess();
  }, [particleCount, duration, colors]);

  return (
    <View style={styles.burstContainer} pointerEvents="none">
      {particles.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.burstParticle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

// Match celebration - hearts floating up
interface MatchCelebrationProps {
  duration?: number;
}

export function MatchCelebration({ duration = 2000 }: MatchCelebrationProps) {
  const hearts = useRef<Array<{
    x: Animated.Value;
    y: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
    startX: number;
  }>>([]);

  useEffect(() => {
    const heartCount = 12;
    
    hearts.current = Array.from({ length: heartCount }, (_, i) => {
      const startX = (i / heartCount) * SCREEN_WIDTH * 0.8 + SCREEN_WIDTH * 0.1;
      
      return {
        x: new Animated.Value(startX),
        y: new Animated.Value(SCREEN_HEIGHT),
        scale: new Animated.Value(0.5 + Math.random() * 0.5),
        opacity: new Animated.Value(0),
        startX,
      };
    });

    const animations = hearts.current.map((heart, index) => {
      const delay = index * 100;
      const wobble = (Math.random() - 0.5) * 60;
      
      return Animated.parallel([
        // Float up
        Animated.timing(heart.y, {
          toValue: -100,
          duration: duration + Math.random() * 500,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // Wobble horizontally
        Animated.sequence([
          Animated.timing(heart.x, {
            toValue: heart.startX + wobble,
            duration: duration / 3,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(heart.x, {
            toValue: heart.startX - wobble,
            duration: duration / 3,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(heart.x, {
            toValue: heart.startX,
            duration: duration / 3,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        // Fade in then out
        Animated.sequence([
          Animated.timing(heart.opacity, {
            toValue: 1,
            duration: 200,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(heart.opacity, {
            toValue: 0,
            duration: duration * 0.3,
            delay: duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
    hapticSuccess();
  }, [duration]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {hearts.current.map((heart, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.heart,
            {
              transform: [
                { translateX: heart.x },
                { translateY: heart.y },
                { scale: heart.scale },
              ],
              opacity: heart.opacity,
            },
          ]}
        >
          💕
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
  burstContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  heart: {
    position: 'absolute',
    fontSize: 24,
  },
});
