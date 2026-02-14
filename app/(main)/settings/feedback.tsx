import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';
import { useAuthStore } from '../../../stores/authStore';

type FeedbackType = 'bug' | 'feature' | 'general' | 'love';

interface FeedbackOption {
  type: FeedbackType;
  icon: string;
  label: string;
  placeholder: string;
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  { type: 'bug', icon: '🐛', label: 'Report a Bug', placeholder: 'Please describe the issue you encountered...' },
  { type: 'feature', icon: '💡', label: 'Feature Request', placeholder: 'What feature would you like to see?' },
  { type: 'general', icon: '💬', label: 'General Feedback', placeholder: 'Share your thoughts with us...' },
  { type: 'love', icon: '💜', label: 'Share Some Love', placeholder: 'Tell us what you love about Better Half!' },
];

export default function FeedbackScreen() {
  const { user, profile } = useAuthStore();
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const selectedOption = FEEDBACK_OPTIONS.find(opt => opt.type === selectedType);
  
  const handleSendFeedback = async () => {
    if (!selectedType || !message.trim()) {
      Alert.alert('Missing Information', 'Please select a feedback type and enter your message.');
      return;
    }
    
    setIsSending(true);
    
    // Compose email with feedback
    const subject = encodeURIComponent(`[${selectedOption?.label}] Better Half Feedback`);
    const body = encodeURIComponent(
      `Feedback Type: ${selectedOption?.label}\n\n` +
      `Message:\n${message}\n\n` +
      `---\n` +
      `User: ${profile?.display_name || 'Unknown'}\n` +
      `Email: ${user?.email || 'Unknown'}\n` +
      `App Version: 1.0.0`
    );
    
    const mailtoUrl = `mailto:feedback@betterhalf.app?subject=${subject}&body=${body}`;
    
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        // Reset form after opening email
        setSelectedType(null);
        setMessage('');
      } else {
        Alert.alert(
          'Email Not Available', 
          'Please email us directly at feedback@betterhalf.app',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open email client. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Send Feedback', headerShown: true }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📝</Text>
          <Text style={styles.headerTitle}>We'd Love to Hear From You!</Text>
          <Text style={styles.headerSubtitle}>
            Your feedback helps us make Better Half better for everyone.
          </Text>
        </View>
        
        {/* Feedback Type Selection */}
        <Text style={styles.sectionTitle}>What type of feedback?</Text>
        
        <View style={styles.typeGrid}>
          {FEEDBACK_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.typeCard,
                selectedType === option.type && styles.typeCardSelected
              ]}
              onPress={() => setSelectedType(option.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.typeIcon}>{option.icon}</Text>
              <Text style={[
                styles.typeLabel,
                selectedType === option.type && styles.typeLabelSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Message Input */}
        {selectedType && (
          <View style={styles.messageSection}>
            <Text style={styles.sectionTitle}>Your Message</Text>
            <Card style={styles.messageCard}>
              <TextInput
                style={styles.messageInput}
                placeholder={selectedOption?.placeholder}
                placeholderTextColor={colors.textPrimaryMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </Card>
            
            <Text style={styles.charCount}>
              {message.length} / 1000 characters
            </Text>
          </View>
        )}
        
        {/* Submit Button */}
        {selectedType && (
          <Button
            title={isSending ? 'Opening Email...' : 'Send Feedback'}
            onPress={handleSendFeedback}
            disabled={isSending || !message.trim()}
            style={styles.submitButton}
          />
        )}
        
        {/* Alternative Contact */}
        <Card style={styles.alternativeCard}>
          <Text style={styles.alternativeTitle}>Prefer Email Directly?</Text>
          <Text style={styles.alternativeText}>
            You can also reach us at:
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:feedback@betterhalf.app')}>
            <Text style={styles.alternativeEmail}>feedback@betterhalf.app</Text>
          </TouchableOpacity>
        </Card>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textPrimarySecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    width: '47%',
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: colors.coral,
    backgroundColor: colors.coral + '10',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    ...typography.body,
    fontFamily: fontFamilies.bodySemiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: colors.coral,
  },
  messageSection: {
    marginBottom: 16,
  },
  messageCard: {
    padding: 0,
    overflow: 'hidden',
  },
  messageInput: {
    ...typography.body,
    color: colors.textPrimary,
    padding: 16,
    minHeight: 150,
  },
  charCount: {
    ...typography.caption,
    color: colors.textPrimaryMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    marginBottom: 24,
  },
  alternativeCard: {
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  alternativeTitle: {
    ...typography.body,
    fontFamily: fontFamilies.bodySemiBold,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  alternativeText: {
    ...typography.caption,
    color: colors.textPrimarySecondary,
    marginBottom: 4,
  },
  alternativeEmail: {
    ...typography.body,
    color: colors.coral,
    fontFamily: fontFamilies.bodySemiBold,
  },
  bottomPadding: {
    height: 40,
  },
});
