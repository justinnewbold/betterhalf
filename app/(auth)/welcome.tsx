import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useDevStore } from '../../stores/devStore';
import { colors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';
import { APP_VERSION, DEV_EMAIL, DEV_PASSWORD } from '../../constants/config';

export default function Welcome() {
  const { signIn } = useAuthStore();
  const { devMode, setDevMode } = useDevStore();
  const [devLoading, setDevLoading] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVersionTap = useCallback(async () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;

      if (devMode) {
        setDevMode(false);
        const msg = 'Dev mode disabled';
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Dev Mode', msg);
        return;
      }

      // Enable dev mode and auto-login
      setDevMode(true);
      setDevLoading(true);
      try {
        const result = await signIn(DEV_EMAIL, DEV_PASSWORD);
        if (result.error) {
          const errMsg = (result.error as any).message || 'Dev auto-login failed';
          Platform.OS === 'web' ? alert(errMsg) : Alert.alert('Dev Mode', errMsg);
          setDevLoading(false);
        } else {
          router.replace('/(auth)/invite');
        }
      } catch (err: any) {
        Platform.OS === 'web' ? alert(err.message) : Alert.alert('Dev Mode', err.message);
        setDevLoading(false);
      }
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 500);
  }, [devMode, setDevMode, signIn]);

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

        <TouchableOpacity onPress={handleVersionTap} activeOpacity={1} disabled={devLoading}>
          <Text style={[styles.version, devMode && styles.versionDev]}>
            {devLoading ? 'Signing in...' : `${APP_VERSION}${devMode ? ' (dev)' : ''}`}
          </Text>
        </TouchableOpacity>
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
    marginBottom: 12,
    gap: 12,
  },
  version: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingBottom: 12,
  },
  versionDev: {
    color: colors.coral,
  },
});
