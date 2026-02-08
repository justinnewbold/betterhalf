import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { getSupabase, TABLES } from '../../../lib/supabase';
import type { Tables } from '../../../lib/supabase';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

type CustomQuestion = Tables['custom_questions'];

const DEFAULT_OPTIONS = ['Option A', 'Option B', 'Option C', 'Option D'];
const MAX_QUESTION_LENGTH = 200;
const MAX_OPTION_LENGTH = 50;

// Basic text sanitization to prevent XSS and clean up input
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/&[#\w]+;/g, '') // Strip HTML entities
    .trim();
}

export default function CustomQuestions() {
  const { user, userProfile } = useAuthStore();
  const { couple, partnerProfile } = useCoupleStore();
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CustomQuestion | null>(null);
  
  // Form state
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [isSaving, setIsSaving] = useState(false);

  const loadQuestions = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !couple?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.custom_questions)
        .select('*')
        .eq('couple_id', couple.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('[CustomQuestions] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [couple?.id]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleClose = () => {
    router.back();
  };

  const openCreateModal = () => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setEditingQuestion(null);
    setShowCreateModal(true);
  };

  const openEditModal = (question: CustomQuestion) => {
    setQuestionText(question.question);
    const questionOptions = question.options as string[];
    setOptions([
      questionOptions[0] || '',
      questionOptions[1] || '',
      questionOptions[2] || '',
      questionOptions[3] || '',
    ]);
    setEditingQuestion(question);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingQuestion(null);
    setQuestionText('');
    setOptions(['', '', '', '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validateForm = (): boolean => {
    const sanitizedQuestion = sanitizeText(questionText);
    if (!sanitizedQuestion) {
      Alert.alert('Missing Question', 'Please enter a question.');
      return false;
    }

    if (sanitizedQuestion.length < 5) {
      Alert.alert('Question Too Short', 'Please enter a longer question (at least 5 characters).');
      return false;
    }

    const filledOptions = options
      .map(o => sanitizeText(o))
      .filter(o => o.length > 0);

    if (filledOptions.length < 2) {
      Alert.alert('Missing Options', 'Please provide at least 2 answer options.');
      return false;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(filledOptions.map(o => o.toLowerCase()));
    if (uniqueOptions.size !== filledOptions.length) {
      Alert.alert('Duplicate Options', 'Each answer option must be unique.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user?.id || !couple?.id) return;

    setIsSaving(true);
    const supabase = getSupabase();
    if (!supabase) {
      setIsSaving(false);
      return;
    }

    try {
      const cleanOptions = options
        .map(o => sanitizeText(o))
        .filter(o => o.length > 0);

      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from(TABLES.custom_questions)
          .update({
            question: sanitizeText(questionText),
            options: cleanOptions,
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;
        Alert.alert('Success', 'Question updated!');
      } else {
        // Create new question
        const { error } = await supabase
          .from(TABLES.custom_questions)
          .insert({
            couple_id: couple.id,
            question: sanitizeText(questionText),
            options: cleanOptions,
            created_by: user.id,
            category: 'custom',
          });

        if (error) throw error;
        Alert.alert('Success', 'Question created! It will appear in your daily questions.');
      }

      closeModal();
      loadQuestions();
    } catch (err: any) {
      console.error('[CustomQuestions] Save error:', err);
      Alert.alert('Error', err.message || 'Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (question: CustomQuestion) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const supabase = getSupabase();
            if (!supabase) return;

            try {
              const { error } = await supabase
                .from(TABLES.custom_questions)
                .update({ is_active: false })
                .eq('id', question.id);

              if (error) throw error;
              loadQuestions();
            } catch (err: any) {
              console.error('[CustomQuestions] Delete error:', err);
              Alert.alert('Error', err.message || 'Failed to delete question');
            }
          },
        },
      ]
    );
  };

  const getCreatorName = (creatorId: string) => {
    if (creatorId === user?.id) {
      return userProfile?.display_name || 'You';
    }
    return partnerProfile?.display_name || 'Partner';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Custom Questions</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Questions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Info Card */}
        <Card variant="gradient" style={styles.infoCard}>
          <Text style={styles.infoTitle}>✨ Create Your Own Questions</Text>
          <Text style={styles.infoText}>
            Add personalized questions that are meaningful to your relationship. 
            They'll randomly appear in your daily games!
          </Text>
        </Card>

        {/* Create Button */}
        <Button
          title="+ Create New Question"
          onPress={openCreateModal}
          fullWidth
          style={styles.createButton}
        />

        {/* Questions List */}
        {questions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💭</Text>
            <Text style={styles.emptyTitle}>No Custom Questions Yet</Text>
            <Text style={styles.emptyText}>
              Create your first question to add a personal touch to your daily games!
            </Text>
          </Card>
        ) : (
          <View style={styles.questionsList}>
            <Text style={styles.sectionTitle}>
              Your Questions ({questions.length})
            </Text>
            
            {questions.map((question) => (
              <Card key={question.id} style={styles.questionCard}>
                <Text style={styles.questionText}>{question.question}</Text>
                
                <View style={styles.optionsPreview}>
                  {(question.options as string[]).map((opt, idx) => (
                    <Text key={idx} style={styles.optionPreview}>
                      • {opt}
                    </Text>
                  ))}
                </View>

                <View style={styles.questionFooter}>
                  <Text style={styles.creatorText}>
                    Created by {getCreatorName(question.created_by)}
                  </Text>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEditModal(question)}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(question)}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingQuestion ? 'Edit Question' : 'Create Question'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {/* Question Input */}
                <Text style={styles.inputLabel}>Question</Text>
                <TextInput
                  style={styles.textInput}
                  value={questionText}
                  onChangeText={setQuestionText}
                  placeholder="What's something your partner would..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={MAX_QUESTION_LENGTH}
                />
                <Text style={styles.charCount}>
                  {questionText.length}/{MAX_QUESTION_LENGTH}
                </Text>

                {/* Options Inputs */}
                <Text style={styles.inputLabel}>Answer Options (min 2)</Text>
                {options.map((option, index) => (
                  <TextInput
                    key={index}
                    style={styles.optionInput}
                    value={option}
                    onChangeText={(value) => updateOption(index, value)}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={colors.textMuted}
                    maxLength={MAX_OPTION_LENGTH}
                  />
                ))}

                <View style={styles.modalButtons}>
                  <Button
                    title="Cancel"
                    onPress={closeModal}
                    variant="ghost"
                    style={styles.modalButton}
                  />
                  <Button
                    title={isSaving ? 'Saving...' : 'Save Question'}
                    onPress={handleSave}
                    disabled={isSaving}
                    style={styles.modalButton}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  createButton: {
    marginBottom: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  questionsList: {
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  optionsPreview: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  optionPreview: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  creatorText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonText: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
  deleteButton: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  deleteButtonText: {
    color: colors.coral,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 20,
    color: colors.textMuted,
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    color: colors.textPrimary,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  charCount: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  optionInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
  },
});
