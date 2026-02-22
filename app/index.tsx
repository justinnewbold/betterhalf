import { Redirect, Href } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useCoupleStore } from '../stores/coupleStore';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { colors } from '../constants/colors';

const COUPLE_LOAD_TIMEOUT_MS = 6000; // 6 second safety timeout for couple loading

export default function Index() {
  const { session, user, isLoading: authLoading, isInitialized } = useAuthStore();
  const { couple, isLoading: coupleLoading, hasFetched, fetchCouple } = useCoupleStore();
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [resetUrl, setResetUrl] = useState<string>('/(auth)/reset-password');
  const [urlChecked, setUrlChecked] = useState(false);
  const [isInviteLink, setIsInviteLink] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [coupleLoadTimedOut, setCoupleLoadTimedOut] = useState(false);
  const fetchCalledRef = useRef(false);

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
    if (session?.user?.id && !hasFetched && !isPasswordReset && urlChecked && !isInviteLink && !fetchCalledRef.current) {
      console.log('[Index] Fetching couple data for user:', session.user.id);
      fetchCalledRef.current = true;
      fetchCouple(session.user.id).catch((err) => {
        console.error('[Index] fetchCouple error:', err);
      });
    }
  }, [session?.user?.id, hasFetched, isPasswordReset, urlChecked, isInviteLink, fetchCouple]);

  // Reset fetchCalledRef when hasFetched changes back (e.g., after a refresh)
  useEffect(() => {
    if (hasFetched) {
      fetchCalledRef.current = false;
    }
  }, [hasFetched]);

  // Safety timeout: if couple data doesn't load within timeout, proceed anyway
  useEffect(() => {
    if (!session?.user || hasFetched || coupleLoadTimedOut) return;
    
    const timeout = setTimeout(() => {
      if (!hasFetched) {
        console.warn('[Index] Couple load timeout reached, proceeding without couple data');
        setCoupleLoadTimedOut(true);
      }
    }, COUPLE_LOAD_TIMEOUT_MS);
    
    return () => clearTimeout(timeout);
  }, [session?.user, hasFetched, coupleLoadTimedOut]);

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
    return <Redirect href={resetUrl as Href} />;
  }

  // Invite link with code - redirect to public invite page
  if (isInviteLink && inviteCode) {
    return <Redirect href={`/invite?code=${inviteCode}` as Href} />;
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

  // Loading couple data - show loading UNLESS we've timed out
  if ((coupleLoading || !hasFetched) && !coupleLoadTimedOut) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  // Logged in but profile not completed -> Setup profile first
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
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 16,
  },
});
