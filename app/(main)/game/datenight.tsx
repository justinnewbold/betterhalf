import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { useThemeStore } from '../../../stores/themeStore';
import { colors, getThemeColors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function DateNight() {
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

  const dynamicStyles = {
    container: {
      backgroundColor: themeColors.background,
    },
    closeButton: {
      color: themeColors.textMuted,
    },
    headerTitle: {
      color: themeColors.textPrimary,
    },
    title: {
      color: themeColors.textPrimary,
    },
    subtitle: {
      color: themeColors.textMuted,
    },
    feature: {
      color: themeColors.textSecondary,
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.closeButton, dynamicStyles.closeButton]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Date Night</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🌙</Text>
        <Text style={[styles.title, dynamicStyles.title]}>Date Night Mode</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          10 questions for a deeper connection.{'\n'}
          Coming soon in the next update!
        </Text>

        <View style={styles.features}>
          <Text style={[styles.feature, dynamicStyles.feature]}>✓ 10 curated questions</Text>
          <Text style={[styles.feature, dynamicStyles.feature]}>✓ Mix of all categories</Text>
          <Text style={[styles.feature, dynamicStyles.feature]}>✓ Perfect for quality time</Text>
        </View>

        <Button
          title="Back to Home"
          onPress={() => router.back()}
          variant="secondary"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    fontSize: 20,
    padding: 4,
  },
  headerTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  features: {
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  feature: {
    ...typography.body,
    marginBottom: 12,
  },
});
