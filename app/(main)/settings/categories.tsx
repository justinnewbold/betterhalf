import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCoupleStore } from '../../../stores/coupleStore';
import { QUESTION_CATEGORIES, QuestionCategory } from '../../../lib/supabase';

export default function CategoriesScreen() {
  const router = useRouter();
  const { couple, updateCategoryPreferences } = useCoupleStore();
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (couple?.preferred_categories) {
      setSelectedCategories(couple.preferred_categories as QuestionCategory[]);
    } else {
      // Default to all categories
      setSelectedCategories(Object.keys(QUESTION_CATEGORIES) as QuestionCategory[]);
    }
  }, [couple]);

  const toggleCategory = (category: QuestionCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Don't allow removing if it's the last one
        if (prev.length === 1) {
          Alert.alert('At least one category required', 'You need at least one question category selected.');
          return prev;
        }
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Question Categories</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Choose which types of questions you'd like to see in your daily sync. 
          Both you and your partner will answer questions from these categories.
        </Text>

        <View style={styles.categoriesContainer}>
          {(Object.entries(QUESTION_CATEGORIES) as [QuestionCategory, typeof QUESTION_CATEGORIES[QuestionCategory]][]).map(([key, category]) => {
            const isSelected = selectedCategories.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                onPress={() => toggleCategory(key)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View style={styles.checkbox}>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </View>
                </View>
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                  {category.label}
                </Text>
                <Text style={[styles.categoryDescription, isSelected && styles.categoryDescriptionSelected]}>
                  {category.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Changes will apply to new questions. Your current daily question won't be affected.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, (!hasChanges() || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges() || isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E4',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginTop: 20,
    marginBottom: 24,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#eee',
  },
  categoryCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF0F0',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 28,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryLabelSelected: {
    color: '#FF6B6B',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  categoryDescriptionSelected: {
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 100,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFF5F5',
    borderTopWidth: 1,
    borderTopColor: '#FFE4E4',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
