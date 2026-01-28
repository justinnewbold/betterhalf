import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
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
    const handlePasswordReset = async () => {
      if (!supabase) {
        setError('Service not available');
        setChecking(false);
        return;
      }

      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          
          // Method 1: Check for PKCE code in query params
          const code = url.searchParams.get('code');
          if (code) {
            console.log('[ResetPassword] Found PKCE code, exchanging for session');
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('[ResetPassword] Code exchange error:', exchangeError);
              setError('Invalid or expired reset link');
              setChecking(false);
              return;
            }
            
            if (data.session) {
              console.log('[ResetPassword] Session established from code');
              setHasValidSession(true);
              setChecking(false);
              // Clean URL
              window.history.replaceState(null, '', window.location.pathname);
              return;
            }
          }
          
          // Method 2: Check for tokens in hash (implicit flow)
          const hash = window.location.hash;
          if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const type = params.get('type');
            
            console.log('[ResetPassword] Hash type:', type, 'Has token:', !!accessToken);
            
            if (type === 'recovery' && accessToken) {
              console.log('[ResetPassword] Setting session from hash tokens');
              const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (sessionError) {
                console.error('[ResetPassword] Session error:', sessionError);
                setError('Invalid or expired reset link');
                setChecking(false);
                return;
              }
              
              if (data.session) {
                console.log('[ResetPassword] Session established from hash');
                setHasValidSession(true);
                setChecking(false);
                window.history.replaceState(null, '', window.location.pathname);
                return;
              }
            }
          }
          
          // Method 3: Check for error in URL (e.g., expired link)
          const errorDesc = url.searchParams.get('error_description') || url.hash.includes('error');
          if (errorDesc) {
            console.error('[ResetPassword] URL error:', errorDesc);
            setError('This reset link has expired. Please request a new one.');
            setChecking(false);
            return;
          }
        }
        
        // Method 4: Check for existing session (maybe already processed)
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[ResetPassword] Existing session check:', !!session);
        
        if (session) {
          setHasValidSession(true);
        } else {
          setError('No valid reset link found. Please request a new password reset.');
        }
      } catch (err) {
        console.error('[ResetPassword] Error:', err);
        setError('Failed to verify reset link');
      } finally {
        setChecking(false);
      }
    };

    // Small delay to ensure URL is fully loaded
    setTimeout(handlePasswordReset, 100);
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
        console.log('[ResetPassword] Password updated successfully');
        // Sign out so user can sign in fresh with new password
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
            {error || 'This password reset link has expired or is invalid.'}
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
