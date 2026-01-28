import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useCoupleStore } from '../stores/coupleStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { colors } from '../constants/colors';

export default function Index() {
  const { session, isLoading: authLoading, isInitialized } = useAuthStore();
  const { couple, isLoading: coupleLoading, hasFetched, fetchCouple } = useCoupleStore();
  const [isPasswordReset, setIsPasswordReset] = useState<boolean | null>(null);

  // Check if this is a password reset link
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = window.location.href;
      const hasCode = url.includes('code=');
      const hasRecoveryHash = window.location.hash.includes('type=recovery');
      const isResetPath = window.location.pathname.includes('reset-password');
      
      console.log('[Index] URL check - code:', hasCode, 'recovery hash:', hasRecoveryHash, 'reset path:', isResetPath);
      
      if (hasCode || hasRecoveryHash || isResetPath) {
        console.log('[Index] Password reset detected, redirecting to reset-password');
        setIsPasswordReset(true);
      } else {
        setIsPasswordReset(false);
      }
    } else {
      setIsPasswordReset(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id && !hasFetched && !isPasswordReset) {
      fetchCouple(session.user.id);
    }
  }, [session?.user?.id, hasFetched, isPasswordReset]);

  // Still checking for password reset
  if (isPasswordReset === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  // Password reset flow - redirect to reset-password page
  if (isPasswordReset) {
    return <Redirect href="/(auth)/reset-password" />;
  }

  // Still initializing auth
  if (!isInitialized || authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  // Not logged in -> Welcome screen
  if (!session?.user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Loading couple data (only show loading if we haven't fetched yet)
  if (coupleLoading || !hasFetched) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  // Logged in but no active couple -> Invite flow
  if (!couple || couple.status !== 'active') {
    return <Redirect href="/(auth)/invite" />;
  }

  // Has active couple -> Main app
  return <Redirect href="/(main)/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
