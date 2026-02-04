import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { colors, getThemeColors } from '../constants/colors';
import AchievementCelebration from '../components/AchievementCelebration';

export default function RootLayout() {
  const { initialize, isInitialized } = useAuthStore();
  const { isDark, initialize: initializeTheme } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize theme (async now)
        await initializeTheme();
        
        // Initialize auth
        await initialize();
      } catch (error) {
        console.error('[RootLayout] Init error:', error);
      } finally {
        // Always mark as ready
        setIsReady(true);
      }
    };
    
    init();
    
    // Safety timeout - if initialization takes more than 5 seconds, show the app anyway
    const timeout = setTimeout(() => {
      if (!isReady) {
        console.warn('[RootLayout] Initialization timeout, forcing ready state');
        setIsReady(true);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Show loading while fonts load or auth initializes (with safety timeout)
  if (!fontsLoaded || (!isInitialized && !isReady)) {
    return (
      <View style={[styles.loading, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themeColors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
      
      {/* Global Achievement Celebration Modal */}
      <AchievementCelebration />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
