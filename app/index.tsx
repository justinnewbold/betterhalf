import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { user, couple } = useAuthStore();

  // Not logged in -> Welcome screen
  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Logged in but no active couple -> Invite flow
  if (!couple || couple.status !== 'active') {
    return <Redirect href="/(auth)/invite" />;
  }

  // Has active couple -> Main app
  return <Redirect href="/(main)/(tabs)" />;
}
