import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCoupleStore } from '../../../stores/coupleStore';
import { useThemeStore } from '../../../stores/themeStore';
import { QUESTION_CATEGORIES, QuestionCategory } from '../../../lib/supabase';
import { colors, getThemeColors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function CategoriesScreen() {
  const router = useRouter();
  const { couple, updateCategoryPreferences } = useCoupleStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
    description: {
      color: themeColors.textSecondary,
    },
    checkbox: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
    },
    checkmark: {
      color: themeColors.textPrimary,
    },
    categoryLabel: {
      color: themeColors.textPrimary,
    },
    categoryDescription: {
      color: themeColors.textMuted,
    },
    manageLink: {
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    manageLinkText: {
      color: themeColors.purpleLight,
    },
    infoTitle: {
      color: themeColors.textPrimary,
    },
    infoText: {
      color: themeColors.textSecondary,
    },
    footer: {
      backgroundColor: themeColors.background,
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
  };

  useEffect(() => {
    if (couple?.preferred_categories && couple.preferred_categories.length > 0) {
      setSelectedCategories(couple.preferred_categories as QuestionCategory[]);
    } else {
      // Default to all categories except custom (user might not have custom questions yet)
      const defaultCategories = QUESTION_CATEGORIES
        .filter(c => c.id !== 'custom')
        .map(c => c.id);
      setSelectedCategories(defaultCategories);
    }
  }, [couple]);

  const toggleCategory = (categoryId: QuestionCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        // Don't allow removing if it's the last one
        if (prev.length === 1) {
          Alert.alert('At least one category required', 'You need at least one question category selected.');
          return prev;
        }
        return prev.filter(c => c !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateCategoryPreferences(selectedCategories);
    setIsSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } else {
      Alert.alert('Saved!', 'Your question preferences have been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const hasChanges = () => {
    const currentCategories = couple?.preferred_categories || [];
    if (currentCategories.length !== selectedCategories.length) return true;
    return !selectedCategories.every(c => currentCategories.includes(c));
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={[styles.closeButton, dynamicStyles.closeButton]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Question Categories</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.description, dynamicStyles.description]}>
          Choose which types of questions you'd like to see in your daily sync. 
          Both you and your partner will answer questions from these categories.
        </Text>

        <View style={styles.categoriesContainer}>
          {QUESTION_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.8}
                onPress={() => toggleCategory(category.id)}
              >
                <Card style={[
                  styles.categoryCard, 
                  isSelected && { borderColor: themeColors.coral, borderWidth: 2 }
                ]}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <View style={[
                      styles.checkbox,
                      dynamicStyles.checkbox,
                      isSelected && { backgroundColor: themeColors.coral, borderColor: themeColors.coral }
                    ]}>
                      {isSelected && <Text style={[styles.checkmark, dynamicStyles.checkmark]}>✓</Text>}
                    </View>
                  </View>
                  <Text style={[
                    styles.categoryLabel, 
                    dynamicStyles.categoryLabel,
                    isSelected && { color: themeColors.coral }
                  ]}>
                    {category.label}
                  </Text>
                  <Text style={[styles.categoryDescription, dynamicStyles.categoryDescription]}>
                    {category.description}
                  </Text>
                  {category.id === 'custom' && (
                    <TouchableOpacity 
                      style={[styles.manageLink, dynamicStyles.manageLink]}
                      onPress={() => router.push('/(main)/settings/custom-questions')}
                    >
                      <Text style={[styles.manageLinkText, dynamicStyles.manageLinkText]}>
                        Manage custom questions →
                      </Text>
                    </TouchableOpacity>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        <Card variant="gradient" style={styles.infoCard}>
          <Text style={[styles.infoTitle, dynamicStyles.infoTitle]}>💡 Good to know</Text>
          <Text style={[styles.infoText, dynamicStyles.infoText]}>
            Changes will apply to new questions. Your current daily question won't be affected.
          </Text>
        </Card>
      </ScrollView>

      <View style={[styles.footer, dynamicStyles.footer]}>
        <Button
          title={isSaving ? 'Saving...' : 'Save Preferences'}
          onPress={handleSave}
          disabled={!hasChanges() || isSaving}
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  description: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: 24,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    marginBottom: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    marginBottom: 6,
  },
  categoryDescription: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  manageLink: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  manageLinkText: {
    ...typography.captionBold,
  },
  infoCard: {
    marginTop: 24,
  },
  infoTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    marginBottom: 6,
  },
  infoText: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
});
