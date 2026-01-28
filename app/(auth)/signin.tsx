import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

    setLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message || 'Invalid email or password');
        setLoading(false);
      } else {
        // Navigate to invite screen - it will redirect to main if couple exists
        router.replace('/(auth)/invite');
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircles}>
            <LinearGradient colors={[colors.coral, colors.coralLight]} style={[styles.circle, styles.circleLeft]} />
            <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.circle, styles.circleRight]} />
          </View>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <Input
          placeholder="Email"
          value={email}
          onChangeText={(text) => { setEmail(text); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={(text) => { setPassword(text); setError(''); }}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title={loading ? "Signing in..." : "Sign In"}
          onPress={handleSignIn}
          loading={loading}
          disabled={loading}
          fullWidth
        />

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
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
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    color: colors.purple,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  footerText: {
    ...typography.body,
    color: colors.textMuted,
  },
  footerLink: {
    ...typography.body,
    color: colors.purple,
  },
});
