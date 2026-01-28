import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
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
  const [debugInfo, setDebugInfo] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    
    const handlePasswordReset = async () => {
      if (!supabase) {
        setError('Service not available');
        setChecking(false);
        return;
      }

      let debug = '';

      try {
        // Log URL info for debugging
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const url = window.location.href;
          const hasCode = url.includes('code=');
          const hasHash = window.location.hash.length > 1;
          const hasError = url.includes('error');
          debug = `URL has code: ${hasCode}, hash: ${hasHash}, error: ${hasError}`;
          console.log('[ResetPassword]', debug);
          
          // Check for error in URL first
          const urlObj = new URL(url);
          const errorParam = urlObj.searchParams.get('error_description') || urlObj.searchParams.get('error');
          if (errorParam) {
            console.log('[ResetPassword] URL error:', errorParam);
            setError(decodeURIComponent(errorParam));
            setChecking(false);
            return;
          }
        }

        // Listen for auth state changes - Supabase will emit events when processing URL
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[ResetPassword] Auth event:', event, 'Has session:', !!session);
          
          if (!mounted.current) return;
          
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            console.log('[ResetPassword] Valid session detected via event');
            setHasValidSession(true);
            setChecking(false);
          } else if (event === 'TOKEN_REFRESHED' && session) {
            setHasValidSession(true);
            setChecking(false);
          }
        });

        // Give Supabase time to process URL and emit events (detectSessionInUrl)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (!mounted.current) return;

        // Check if session was established
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[ResetPassword] Session after wait:', !!session);
        
        if (session) {
          setHasValidSession(true);
          setChecking(false);
          subscription.unsubscribe();
          return;
        }

        // If no session yet but we have URL params, try manual exchange
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code');
          
          if (code) {
            console.log('[ResetPassword] Manually exchanging code');
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (!mounted.current) return;
            
            if (exchangeError) {
              console.error('[ResetPassword] Exchange error:', exchangeError);
              // Code might have already been used
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession) {
                setHasValidSession(true);
              } else {
                setError('Reset link expired or already used');
              }
            } else if (data?.session) {
              console.log('[ResetPassword] Session from manual exchange');
              setHasValidSession(true);
            }
            setChecking(false);
            subscription.unsubscribe();
            return;
          }
          
          // Try hash tokens (implicit flow fallback)
          const hash = window.location.hash;
          if (hash && hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken) {
              console.log('[ResetPassword] Setting session from hash');
              const { error: setError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (!setError) {
                setHasValidSession(true);
                setChecking(false);
                subscription.unsubscribe();
                return;
              }
            }
          }
        }

        // Final check
        setDebugInfo(debug);
        if (!hasValidSession) {
          setError('No valid reset session. Please request a new password reset link.');
        }
        subscription.unsubscribe();
      } catch (err: any) {
        console.error('[ResetPassword] Error:', err);
        if (mounted.current) {
          setError(err.message || 'Failed to verify reset link');
        }
      } finally {
        if (mounted.current) {
          setChecking(false);
        }
      }
    };

    handlePasswordReset();

    return () => {
      mounted.current = false;
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
          {debugInfo ? <Text style={styles.debug}>{debugInfo}</Text> : null}

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
  debug: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.6,
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
