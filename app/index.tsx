import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useCoupleStore } from '../stores/coupleStore';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default function Index() {
  const { session, isLoading: authLoading } = useAuthStore();
  const { couple, isLoading: coupleLoading, fetchCouple } = useCoupleStore();

  useEffect(() => {
    if (session?.user?.id) {
      fetchCouple(session.user.id);
    }
  }, [session?.user?.id]);

  // Still loading auth
  if (authLoading) {
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

  // Loading couple data
  if (coupleLoading) {
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
