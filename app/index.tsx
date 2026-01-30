import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useCoupleStore } from '../stores/coupleStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { colors } from '../constants/colors';

export default function Index() {
  const { session, user, isLoading: authLoading, isInitialized } = useAuthStore();
  const { couple, isLoading: coupleLoading, hasFetched, fetchCouple } = useCoupleStore();
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [resetUrl, setResetUrl] = useState<string>('/(auth)/reset-password');
  const [urlChecked, setUrlChecked] = useState(false);
  const [isInviteLink, setIsInviteLink] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Check URL parameters - only runs once on mount
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = window.location.href;
      const search = window.location.search;
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(search);
      
      // Check for password reset
      const hasCode = url.includes('code=') && !pathname.includes('/invite');
      const hasRecoveryHash = hash.includes('type=recovery');
      const isResetPath = pathname.includes('reset-password');
      
      console.log('[Index] URL check - code:', hasCode, 'recovery hash:', hasRecoveryHash, 'reset path:', isResetPath);
      
      if (hasCode || hasRecoveryHash || isResetPath) {
        console.log('[Index] Password reset detected, redirecting to reset-password');
        const resetPath = `/(auth)/reset-password${search}${hash}`;
        setResetUrl(resetPath);
        setIsPasswordReset(true);
        setUrlChecked(true);
        return;
      }
      
      // Check for invite link with code
      const code = searchParams.get('code');
      if (pathname === '/invite' && code) {
        console.log('[Index] Invite link detected with code:', code);
        setInviteCode(code);
        setIsInviteLink(true);
        setUrlChecked(true);
        return;
      }
    }
    setUrlChecked(true);
  }, []);

  // Fetch couple data when session is available and not already fetched
  useEffect(() => {
    if (session?.user?.id && !hasFetched && !isPasswordReset && urlChecked && !isInviteLink) {
      console.log('[Index] Fetching couple data for user:', session.user.id);
      fetchCouple(session.user.id);
    }
  }, [session?.user?.id, hasFetched, isPasswordReset, urlChecked, isInviteLink, fetchCouple]);

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

  // Invite link with code - redirect to public invite page
  if (isInviteLink && inviteCode) {
    return <Redirect href={`/invite?code=${inviteCode}` as any} />;
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

  // Logged in but profile not completed -> Setup profile first
  // Check if user exists and has NOT completed profile setup
  if (user && !user.profile_completed) {
    console.log('[Index] Profile not completed, redirecting to setup');
    return <Redirect href="/(auth)/setup-profile" />;
  }

  // Logged in, profile complete, but no active couple -> Invite flow
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
