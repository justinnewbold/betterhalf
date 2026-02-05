import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getSupabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setError('Service not available');
      setChecking(false);
      return;
    }

    let isMounted = true;
    let checkCount = 0;
    const maxChecks = 10;

    // Listen for auth events from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ResetPassword] Auth event:', event);
      
      if (!isMounted) return;
      
      // PASSWORD_RECOVERY event means we have a valid reset session
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[ResetPassword] PASSWORD_RECOVERY event received!');
        setHasValidSession(true);
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Sometimes it comes as SIGNED_IN
        console.log('[ResetPassword] SIGNED_IN with session');
        setHasValidSession(true);
        setChecking(false);
      }
    });

    // Poll for session since event might have already fired before listener was set up
    const checkSession = async () => {
      if (!isMounted || checkCount >= maxChecks) {
        if (isMounted && !hasValidSession) {
          console.log('[ResetPassword] Max checks reached, no session found');
          setChecking(false);
        }
        return;
      }

      checkCount++;
      console.log('[ResetPassword] Session check #', checkCount);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && isMounted) {
        console.log('[ResetPassword] Found session on check #', checkCount);
        setHasValidSession(true);
        setChecking(false);
        return;
      }
      
      // Check again after delay
      if (isMounted && checkCount < maxChecks) {
        setTimeout(checkSession, 500);
      }
    };

    // Start checking after a short delay to let Supabase process URL
    setTimeout(checkSession, 300);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (!password.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError('Service not available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('[ResetPassword] Update error:', error);
        setError(error.message);
      } else {
        console.log('[ResetPassword] Password updated!');
        // Sign out and redirect to sign in
        await supabase.auth.signOut();
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('[ResetPassword] Exception:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasValidSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircles}>
              <LinearGradient colors={[colors.coral, colors.coralLight]} style={[styles.circle, styles.circleLeft]} />
              <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.circle, styles.circleRight]} />
            </View>
          </View>

          <Text style={styles.title}>Link Expired</Text>
          <Text style={styles.subtitle}>
            This password reset link has expired or is invalid. Please request a new one.
          </Text>

          <View style={styles.spacer} />

          <Button
            title="Request New Link"
            onPress={() => router.replace('/(auth)/forgot-password')}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircles}>
              <LinearGradient colors={[colors.coral, colors.coralLight]} style={[styles.circle, styles.circleLeft]} />
              <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.circle, styles.circleRight]} />
            </View>
          </View>

          <Text style={styles.title}>Password Updated! 🎉</Text>
          <Text style={styles.subtitle}>
            Your password has been successfully updated. You can now sign in with your new password.
          </Text>

          <View style={styles.spacer} />

          <Button
            title="Sign In"
            onPress={() => router.replace('/(auth)/signin')}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircles}>
            <LinearGradient colors={[colors.coral, colors.coralLight]} style={[styles.circle, styles.circleLeft]} />
            <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.circle, styles.circleRight]} />
          </View>
        </View>

        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>Enter your new password below</Text>

        <Input
          placeholder="New Password"
          value={password}
          onChangeText={(text) => { setPassword(text); setError(''); }}
          secureTextEntry
        />

        <Input
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title={loading ? "Updating..." : "Update Password"}
          onPress={handleUpdatePassword}
          loading={loading}
          disabled={loading}
          fullWidth
        />

        <View style={styles.spacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 16,
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
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  spacer: {
    flex: 1,
  },
});
