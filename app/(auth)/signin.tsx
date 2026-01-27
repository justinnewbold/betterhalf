import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';

export default function SignIn() {
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message || String(result.error));
        setLoading(false);
      } else {
        // Auth state change will trigger redirect via index.tsx
        // Give it a moment then redirect
        setTimeout(() => {
          router.replace('/');
        }, 300);
      }
    } catch (e) {
      setError('Sign in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoCircles}>
              <LinearGradient colors={[colors.coral, colors.coralLight]} style={[styles.circle, styles.circleLeft]} />
              <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.circle, styles.circleRight]} />
            </View>
            <Text style={styles.logoText}>Better Half</Text>
          </View>

          {/* Header */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              fullWidth
            />

            <Text style={styles.signupLink}>
              Don't have an account?{' '}
              <Text style={styles.linkText} onPress={() => router.push('/(auth)/signup')}>
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircles: {
    width: 40,
    height: 30,
    position: 'relative',
    marginRight: 10,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
  },
  circleLeft: {
    left: 0,
  },
  circleRight: {
    right: 0,
  },
  logoText: {
    fontFamily: fontFamilies.display,
    fontSize: 18,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 32,
  },
  form: {
    flex: 1,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
  signupLink: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  linkText: {
    color: colors.purpleLight,
  },
});
