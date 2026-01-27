import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

/**
 * Public invite route - redirects to auth invite screen with code
 * Handles URLs like: https://betterhalf.newbold.cloud/invite?code=ABC123
 */
export default function InviteRedirect() {
  const params = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    // Redirect to the auth invite screen with the code
    if (params.code) {
      router.replace({
        pathname: '/(auth)/invite',
        params: { code: params.code },
      });
    } else {
      // No code provided, go to welcome
      router.replace('/(auth)/welcome');
    }
  }, [params.code]);

  return null;
}
