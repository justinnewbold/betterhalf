import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useCoupleStore } from '../stores/coupleStore';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { colors } from '../constants/colors';

export default function Index() {
  const { session, isLoading: authLoading, isInitialized } = useAuthStore();
  const { couple, isLoading: coupleLoading, hasFetched, fetchCouple } = useCoupleStore();
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [resetUrl, setResetUrl] = useState<string>('/(auth)/reset-password');
  const [urlChecked, setUrlChecked] = useState(false);
  const fetchTriggered = useRef(false);

  // Check if this is a password reset link - only runs once
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = window.location.href;
      const search = window.location.search;
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      
      const hasCode = url.includes('code=');
      const hasRecoveryHash = hash.includes('type=recovery');
      const isResetPath = pathname.includes('reset-password');
      
      console.log('[Index] URL check - code:', hasCode, 'recovery hash:', hasRecoveryHash, 'reset path:', isResetPath);
      
      if (hasCode || hasRecoveryHash || isResetPath) {
        console.log('[Index] Password reset detected, redirecting to reset-password');
        const resetPath = `/(auth)/reset-password${search}${hash}`;
        setResetUrl(resetPath);
        setIsPasswordReset(true);
      }
    }
    setUrlChecked(true);
  }, []);

  // Fetch couple data when session is available
  useEffect(() => {
    if (session?.user?.id && !hasFetched && !fetchTriggered.current && !isPasswordReset && urlChecked) {
      fetchTriggered.current = true;
      fetchCouple(session.user.id);
    }
  }, [session?.user?.id, hasFetched, isPasswordReset, urlChecked]);

  // Reset fetch trigger if user changes
  useEffect(() => {
    fetchTriggered.current = false;
  }, [session?.user?.id]);

  // Still checking URL
  if (!urlChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  // Password reset flow - redirect to reset-password page with params preserved
  if (isPasswordReset) {
    return <Redirect href={resetUrl as any} />;
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
