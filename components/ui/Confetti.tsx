import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
}

interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
  autoStart?: boolean;
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
];

export function Confetti({ 
  count = 50, 
  duration = 3000,
  colors = DEFAULT_COLORS,
  autoStart = true,
  onComplete,
}: ConfettiProps) {
  const pieces = useRef<ConfettiPiece[]>([]);
  const animationsStarted = useRef(false);

  // Initialize confetti pieces
  useEffect(() => {
    pieces.current = Array.from({ length: count }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-50 - Math.random() * 100),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
    }));
  }, [count, colors]);

  useEffect(() => {
    if (autoStart && !animationsStarted.current) {
      startAnimation();
      animationsStarted.current = true;
    }
  }, [autoStart]);

  const startAnimation = () => {
    const animations = pieces.current.map((piece, index) => {
      const delay = index * 30;
      const horizontalDrift = (Math.random() - 0.5) * 200;
      
      return Animated.parallel([
        // Fall down
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 100,
          duration: duration + Math.random() * 1000,
          delay,
          easing: Easing.quad,
          useNativeDriver: true,
        }),
        // Horizontal drift
        Animated.timing(piece.x, {
          toValue: piece.x._value + horizontalDrift,
          duration: duration + Math.random() * 1000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Rotate
        Animated.timing(piece.rotate, {
          toValue: 360 * (2 + Math.random() * 3),
          duration: duration + Math.random() * 1000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(20, animations).start(() => {
      onComplete?.();
    });
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.current.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.piece,
            {
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size * 1.5,
              borderRadius: piece.size / 4,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                { 
                  rotate: piece.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })
                },
                { scale: piece.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// Celebration burst animation with scaling circles
export function CelebrationBurst({ show, color = '#C084FC' }: { show: boolean; color?: string }) {
  const scale1 = useRef(new Animated.Value(0)).current;
  const scale2 = useRef(new Animated.Value(0)).current;
  const scale3 = useRef(new Animated.Value(0)).current;
  const opacity1 = useRef(new Animated.Value(0.8)).current;
  const opacity2 = useRef(new Animated.Value(0.6)).current;
  const opacity3 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (show) {
      // Reset
      scale1.setValue(0);
      scale2.setValue(0);
      scale3.setValue(0);
      opacity1.setValue(0.8);
      opacity2.setValue(0.6);
      opacity3.setValue(0.4);

      // Animate
      Animated.stagger(100, [
        Animated.parallel([
          Animated.timing(scale1, {
            toValue: 2,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity1, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale2, {
            toValue: 2.5,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity2, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale3, {
            toValue: 3,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity3, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [show]);

  if (!show) return null;

  return (
    <View style={styles.burstContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.burst,
          {
            backgroundColor: color,
            transform: [{ scale: scale1 }],
            opacity: opacity1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.burst,
          {
            backgroundColor: color,
            transform: [{ scale: scale2 }],
            opacity: opacity2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.burst,
          {
            backgroundColor: color,
            transform: [{ scale: scale3 }],
            opacity: opacity3,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 100,
  },
  piece: {
    position: 'absolute',
  },
  burstContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  burst: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
