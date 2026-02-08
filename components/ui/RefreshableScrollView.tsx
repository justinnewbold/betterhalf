import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  RefreshControl, 
  StyleSheet, 
  ViewStyle,
  Platform 
} from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { getThemeColors } from '../../constants/colors';

interface RefreshableScrollViewProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function RefreshableScrollView({ 
  children, 
  onRefresh, 
  style,
  contentContainerStyle 
}: RefreshableScrollViewProps) {
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={themeColors.purple}
          colors={[themeColors.purple, themeColors.coral]}
          progressBackgroundColor={themeColors.cardBackground}
          title={Platform.OS === 'ios' ? 'Pull to refresh' : undefined}
          titleColor={themeColors.textMuted}
        />
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
