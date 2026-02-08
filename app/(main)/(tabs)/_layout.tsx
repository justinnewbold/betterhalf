import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../../stores/themeStore';
import { getThemeColors } from '../../../constants/colors';

function TabIcon({ icon, label, focused, isDark }: { icon: string; label: string; focused: boolean; isDark: boolean }) {
  const themeColors = getThemeColors(isDark);
  
  return (
    <View style={styles.tabItem} accessibilityLabel={label} accessibilityRole="tab" accessibilityState={{ selected: focused }}>
      <View style={styles.iconContainer}>
        <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      </View>
      <Text style={[
        styles.tabLabel,
        { color: themeColors.textMuted },
        focused && { color: themeColors.coral }
      ]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: themeColors.cardBackground,
          borderTopColor: themeColors.cardBorder,
          borderTopWidth: 1,
          height: 80,
          paddingTop: 8,
          paddingBottom: 20,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} isDark={isDark} />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          tabBarAccessibilityLabel: 'Play',
          tabBarIcon: ({ focused }) => <TabIcon icon="🎮" label="Play" focused={focused} isDark={isDark} />,
        }}
      />
      {/* Friends tab hidden for MVP - will be enabled in future release */}
      <Tabs.Screen
        name="friends"
        options={{
          href: null, // This hides the tab from navigation
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarAccessibilityLabel: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Stats" focused={focused} isDark={isDark} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} isDark={isDark} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
  },
});