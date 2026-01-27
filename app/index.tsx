import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useCoupleStore } from '../stores/coupleStore';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default function Index() {
  const { session, isLoading: authLoading, isInitialized } = useAuthStore();
  const { couple, isLoading: coupleLoading, hasFetched, fetchCouple } = useCoupleStore();

  useEffect(() => {
    if (session?.user?.id && !hasFetched) {
      fetchCouple(session.user.id);
    }
  }, [session?.user?.id, hasFetched]);

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
