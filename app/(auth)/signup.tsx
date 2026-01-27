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

export default function SignUp() {
  const { signUp } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const result = await signUp(email, password, name);
      setLoading(false);
      
      if (result.error) {
        setError(result.error.message || String(result.error));
      } else {
        // Show email confirmation screen
        setShowConfirmation(true);
      }
    } catch (e: any) {
      setError(e?.message || 'Sign up failed. Please try again.');
      setLoading(false);
    }
  };

  // Email confirmation screen
  if (showConfirmation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmationContainer}>
          <View style={styles.logoRowCenter}>
            <View style={styles.logoCircles}>
              <LinearGradient colors={[colors.coral, colors.coralLight]} style={[styles.circle, styles.circleLeft]} />
              <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.circle, styles.circleRight]} />
            </View>
          </View>
          
          <Text style={styles.confirmTitle}>Check Your Email! 📧</Text>
          <Text style={styles.confirmText}>
            We sent a confirmation link to
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.confirmSubtext}>
            Click the link in your email to activate your account, then come back here and sign in.
          </Text>
          
          <View style={styles.confirmButtonContainer}>
            <Button
              title="Go to Sign In"
              onPress={() => router.replace('/(auth)/signin')}
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Let's get you set up</Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Input
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              placeholder="Password (min 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? "Creating account..." : "Create Account"}
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              fullWidth
            />

            <Text style={styles.loginLink}>
              Already have an account?{' '}
              <Text style={styles.linkText} onPress={() => router.push('/(auth)/signin')}>
                Sign in
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
  confirmationContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  confirmTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 16,
    marginTop: 32,
    textAlign: 'center',
  },
  confirmText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    ...typography.body,
    color: colors.purpleLight,
    fontFamily: fontFamilies.semiBold,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmSubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  confirmButtonContainer: {
    width: '100%',
    marginTop: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoRowCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircles: {
    width: 60,
    height: 40,
    position: 'relative',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    position: 'absolute',
  },
  circleLeft: {
    left: 0,
    top: 4,
  },
  circleRight: {
    right: 0,
    top: 4,
  },
  logoText: {
    fontFamily: fontFamilies.display,
    fontSize: 18,
    color: colors.textPrimary,
    marginLeft: 8,
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
  loginLink: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  linkText: {
    color: colors.purpleLight,
  },
});
