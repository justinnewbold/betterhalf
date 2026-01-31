import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card } from '../../../components/ui/Card';
import { useTheme } from '../../../hooks/useTheme';
import { useThemeStore, ThemeMode } from '../../../stores/themeStore';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

interface ThemeOptionProps {
  mode: ThemeMode;
  label: string;
  icon: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  isDark: boolean;
}

function ThemeOption({ mode, label, icon, description, isSelected, onSelect, isDark }: ThemeOptionProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onSelect}
    >
      <Card style={[
        styles.optionCard,
        isSelected && styles.optionCardSelected,
        !isDark && styles.optionCardLight,
        isSelected && !isDark && styles.optionCardSelectedLight,
      ]}>
        <View style={styles.optionHeader}>
          <Text style={styles.optionIcon}>{icon}</Text>
          <View style={[
            styles.radioOuter,
            isSelected && styles.radioOuterSelected,
          ]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
        <Text style={[
          styles.optionLabel,
          !isDark && styles.textDark,
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.optionDescription,
          !isDark && styles.textMutedLight,
        ]}>
          {description}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

export default function AppearanceScreen() {
  const { mode, isDark, setMode } = useTheme();

  const handleClose = () => {
    router.back();
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: string; description: string }[] = [
    {
      mode: 'dark',
      label: 'Dark',
      icon: '🌙',
      description: 'Easy on the eyes, great for night time',
    },
    {
      mode: 'light',
      label: 'Light',
      icon: '☀️',
      description: 'Bright and clear, perfect for daytime',
    },
    {
      mode: 'system',
      label: 'System',
      icon: '📱',
      description: 'Match your device settings automatically',
    },
  ];

  return (
    <SafeAreaView style={[
      styles.container,
      !isDark && styles.containerLight,
    ]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={[styles.closeButton, !isDark && styles.textMutedLight]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, !isDark && styles.textDark]}>Appearance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, !isDark && styles.textMutedLight]}>
          THEME
        </Text>

        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => (
            <ThemeOption
              key={option.mode}
              mode={option.mode}
              label={option.label}
              icon={option.icon}
              description={option.description}
              isSelected={mode === option.mode}
              onSelect={() => setMode(option.mode)}
              isDark={isDark}
            />
          ))}
        </View>

        <Card variant="gradient" style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Theme Tip</Text>
          <Text style={styles.infoText}>
            Dark mode is easier on your eyes at night and can save battery on OLED screens. 
            System mode will automatically switch based on your device settings.
          </Text>
        </Card>

        {/* Preview Section */}
        <Text style={[styles.sectionTitle, !isDark && styles.textMutedLight, { marginTop: 24 }]}>
          PREVIEW
        </Text>

        <Card style={[styles.previewCard, !isDark && styles.previewCardLight]}>
          <View style={styles.previewHeader}>
            <View style={[styles.previewAvatar, !isDark && styles.previewAvatarLight]}>
              <Text style={styles.previewAvatarText}>💕</Text>
            </View>
            <View>
              <Text style={[styles.previewTitle, !isDark && styles.textDark]}>
                Daily Sync
              </Text>
              <Text style={[styles.previewSubtitle, !isDark && styles.textMutedLight]}>
                Answer today's question together
              </Text>
            </View>
          </View>
          <View style={[styles.previewButton, !isDark && styles.previewButtonLight]}>
            <Text style={styles.previewButtonText}>Play Now</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  containerLight: {
    backgroundColor: '#F8F9FC',
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
    color: colors.textMuted,
    padding: 4,
  },
  headerTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    marginBottom: 0,
  },
  optionCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  optionCardSelected: {
    borderColor: colors.coral,
    borderWidth: 2,
  },
  optionCardSelectedLight: {
    borderColor: '#E85555',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 32,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.coral,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.coral,
  },
  optionLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  textDark: {
    color: '#1A1A2E',
  },
  textMutedLight: {
    color: 'rgba(26,26,46,0.5)',
  },
  infoCard: {
    marginTop: 24,
  },
  infoTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  previewCard: {
    padding: 16,
  },
  previewCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,107,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewAvatarLight: {
    backgroundColor: 'rgba(232,85,85,0.15)',
  },
  previewAvatarText: {
    fontSize: 24,
  },
  previewTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  previewSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  previewButton: {
    backgroundColor: colors.coral,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  previewButtonLight: {
    backgroundColor: '#E85555',
  },
  previewButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});