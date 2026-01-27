import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';

export default function Welcome() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircles}>
            <LinearGradient
              colors={[colors.coral, colors.coralLight]}
              style={[styles.circle, styles.circleLeft]}
            />
            <LinearGradient
              colors={[colors.purple, colors.purpleLight]}
              style={[styles.circle, styles.circleRight]}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Better Half</Text>
        <Text style={styles.subtitle}>How well do you really{'\n'}know each other?</Text>

        {/* Description */}
        <View style={styles.features}>
          <Text style={styles.feature}>🎯 Daily questions to test your sync</Text>
          <Text style={styles.feature}>💕 Build deeper connection</Text>
          <Text style={styles.feature}>🏆 Track your relationship score</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/signup')}
            fullWidth
          />
          <Button
            title="I have an account"
            onPress={() => router.push('/(auth)/signin')}
            variant="secondary"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircles: {
    width: 100,
    height: 70,
    position: 'relative',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
  },
  circleLeft: {
    left: 0,
    top: 5,
  },
  circleRight: {
    right: 0,
    top: 5,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 42,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  features: {
    marginBottom: 48,
  },
  feature: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttons: {
    marginTop: 'auto',
    marginBottom: 32,
    gap: 12,
  },
});
