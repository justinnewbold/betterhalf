import { Stack } from 'expo-router';
import { colors } from '../../constants/colors';
import AchievementCelebration from '../../components/AchievementCelebration';

export default function MainLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.darkBg },
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
