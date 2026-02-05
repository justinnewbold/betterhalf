import { Stack } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import { getThemeColors } from '../../constants/colors';
import AchievementCelebration from '../../components/AchievementCelebration';

export default function MainLayout() {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themeColors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="game/daily" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="game/datenight" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
      </Stack>
      
      {/* Global Achievement Celebration Modal */}
      <AchievementCelebration />
    </>
  );
}
