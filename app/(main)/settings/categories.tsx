import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCoupleStore } from '../../../stores/coupleStore';
import { QUESTION_CATEGORIES, QuestionCategory } from '../../../lib/supabase';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function CategoriesScreen() {
  const router = useRouter();
  const { couple, updateCategoryPreferences } = useCoupleStore();
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Question Categories</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
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
                  isSelected && styles.categoryCardSelected
                ]}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>
                  <Text style={[
                    styles.categoryLabel, 
                    isSelected && styles.categoryLabelSelected
                  ]}>
                    {category.label}
                  </Text>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                  {category.id === 'custom' && (
                    <TouchableOpacity 
                      style={styles.manageLink}
                      onPress={() => router.push('/(main)/settings/custom-questions')}
                    >
                      <Text style={styles.manageLinkText}>
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
          <Text style={styles.infoTitle}>💡 Good to know</Text>
          <Text style={styles.infoText}>
            Changes will apply to new questions. Your current daily question won't be affected.
          </Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
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
    backgroundColor: colors.darkBg,
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
    paddingBottom: 120,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    marginBottom: 0,
  },
  categoryCardSelected: {
    borderColor: colors.coral,
    borderWidth: 2,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  checkmark: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  categoryLabelSelected: {
    color: colors.coral,
  },
  categoryDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
    lineHeight: 20,
  },
  manageLink: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  manageLinkText: {
    ...typography.captionBold,
    color: colors.purpleLight,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    backgroundColor: colors.darkBg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});
