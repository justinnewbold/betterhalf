import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';

interface SyncScoreRingProps {
  percentage: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function SyncScoreRing({ percentage, size = 'medium', showLabel = true }: SyncScoreRingProps) {
  const dimensions = {
    small: { outer: 80, inner: 64, stroke: 6, fontSize: 20 },
    medium: { outer: 120, inner: 96, stroke: 8, fontSize: 28 },
    large: { outer: 160, inner: 128, stroke: 10, fontSize: 36 },
  };

  const { outer, inner, stroke, fontSize } = dimensions[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { width: outer, height: outer }]}>
      <Svg width={outer} height={outer} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          stroke={colors.purpleLight}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform={`rotate(-90 ${outer / 2} ${outer / 2})`}
        />
      </Svg>
      <View style={[styles.inner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        <Text style={[styles.percentage, { fontSize }]}>{Math.round(percentage)}%</Text>
        {showLabel && <Text style={styles.label}>SYNC</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  inner: {
    backgroundColor: colors.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontFamily: fontFamilies.bodyBold,
    color: colors.purpleLight,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
