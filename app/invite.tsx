import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useCoupleStore } from '../stores/coupleStore';
import { colors } from '../constants/colors';
import { typography, fontFamilies } from '../constants/typography';

/**
 * Public invite landing page
 * Handles URLs like: https://betterhalf.newbold.cloud/invite?code=ABC123
 * 
 * Shows a welcome screen for new users with the invite code,
 * or auto-joins for logged-in users
 */
export default function InviteLanding() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { session, isLoading: authLoading } = useAuthStore();
  const { couple, joinCouple, fetchCouple } = useCoupleStore();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  const inviteCode = params.code?.toUpperCase();

  useEffect(() => {
    // If user is logged in and has a code, try to auto-join
    if (session?.user?.id && inviteCode && !couple && !isJoining && !joined) {
      handleAutoJoin();
    }
  }, [session?.user?.id, inviteCode, couple]);

  useEffect(() => {
    // If user already has an active couple, redirect to main
    if (couple?.status === 'active') {
      router.replace('/(main)/(tabs)');
    }
  }, [couple]);

  const handleAutoJoin = async () => {
    if (!session?.user?.id || !inviteCode) return;
    
    setIsJoining(true);
    setError('');
    
    const result = await joinCouple(session.user.id, inviteCode);
    
    if (result.error) {
      setError(result.error.message || 'This invite code is invalid or has expired');
      setIsJoining(false);
    } else {
      setJoined(true);
      // Will redirect via the couple useEffect
    }
  };

  const handleGetStarted = () => {
    if (inviteCode) {
      // Save code and go to signup
      router.push({
        pathname: '/(auth)/signup',
        params: { inviteCode },
      });
    } else {
      router.push('/(auth)/welcome');
    }
  };

  const handleSignIn = () => {
    if (inviteCode) {
      router.push({
        pathname: '/(auth)/login',
        params: { inviteCode },
      });
    } else {
      router.push('/(auth)/login');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      </SafeAreaView>
    );
  }

  // If logged in and joining
  if (session && isJoining) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={styles.joiningText}>Joining your partner...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If logged in and joined successfully
  if (session && joined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.successTitle}>You're Connected!</Text>
          <Text style={styles.successText}>Redirecting to your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main invite landing UI
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

        {/* Invitation Message */}
        <Text style={styles.inviteEmoji}>💕</Text>
        <Text style={styles.title}>You've Been Invited!</Text>
        <Text style={styles.subtitle}>
          Someone special wants to connect with you on Better Half
        </Text>

        {inviteCode && (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>INVITE CODE</Text>
            <Text style={styles.codeValue}>{inviteCode}</Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Feature Highlights */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>💬</Text>
            <Text style={styles.featureText}>Daily questions to spark connection</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🔥</Text>
            <Text style={styles.featureText}>Build streaks together</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>💫</Text>
            <Text style={styles.featureText}>Discover how in sync you are</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Action Buttons */}
        {session ? (
          // Logged in - show join button
          <>
            <Button 
              title={isJoining ? "Joining..." : "Accept Invitation"} 
              onPress={handleAutoJoin}
              loading={isJoining}
              disabled={isJoining || !inviteCode}
              fullWidth 
            />
            <View style={{ height: 12 }} />
            <Button 
              title="Go to Dashboard" 
              onPress={() => router.replace('/(main)/(tabs)')}
              variant="secondary"
              fullWidth 
            />
          </>
        ) : (
          // Not logged in - show signup/signin
          <>
            <Button 
              title="Get Started" 
              onPress={handleGetStarted}
              fullWidth 
            />
            <View style={{ height: 12 }} />
            <Button 
              title="I Already Have an Account" 
              onPress={handleSignIn}
              variant="secondary"
              fullWidth 
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircles: {
    width: 60,
    height: 40,
    position: 'relative',
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    position: 'absolute',
  },
  circleLeft: {
    left: 0,
  },
  circleRight: {
    right: 0,
  },
  inviteEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  codeBox: {
    backgroundColor: 'rgba(192,132,252,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(192,132,252,0.3)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  codeValue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 28,
    color: colors.purpleLight,
    letterSpacing: 4,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  features: {
    marginTop: 8,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  joiningText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 16,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  successText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
