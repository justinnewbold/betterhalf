import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  from?: 'bottom' | 'top' | 'left' | 'right' | 'none';
  distance?: number;
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 400,
  style,
  from = 'bottom',
  distance = 20
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.spring(translate, {
          toValue: 0,
          speed: 14,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, duration]);

  const getTransform = () => {
    switch (from) {
      case 'bottom':
        return [{ translateY: translate }];
      case 'top':
        return [{ translateY: Animated.multiply(translate, -1) }];
      case 'left':
        return [{ translateX: Animated.multiply(translate, -1) }];
      case 'right':
        return [{ translateX: translate }];
      default:
        return [];
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: from !== 'none' ? getTransform() : undefined,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
