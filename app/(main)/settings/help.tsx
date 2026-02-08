import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Card } from '../../../components/ui/Card';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does Better Half work?',
    answer: 'Better Half sends you and your partner daily questions. You each answer independently, then see if you matched! The more you play, the better you understand each other.',
  },
  {
    question: 'What is a streak?',
    answer: 'A streak counts consecutive days you and your partner both play. Keep it going to earn achievements! Your streak resets if either of you misses a day.',
  },
  {
    question: 'How do I invite my partner?',
    answer: 'Go to Settings and tap "Invite Your Person". You can share an invite link via text, email, or any messaging app. Once they join, you\'ll be connected!',
  },
  {
    question: 'Can I change the question categories?',
    answer: 'Yes! Go to Settings > Question Categories to select which types of questions you want to receive. You can enable or disable categories at any time.',
  },
  {
    question: 'What is Date Night mode?',
    answer: 'Date Night offers deeper, more thoughtful questions designed for meaningful conversations. Perfect for quality time together!',
  },
  {
    question: 'How do I disconnect from my partner?',
    answer: 'Go to Settings and scroll to the Connection section. Tap "Disconnect" to end the connection. Note: This will reset your shared stats and streak.',
  },
  {
    question: 'Is my data private?',
    answer: 'Absolutely! Your answers are only visible to you and your connected partner. We never share your personal information with third parties.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'Contact us at support@betterhalf.app and we\'ll help you delete your account and all associated data within 48 hours.',
  },
];

export default function HelpScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };
  
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@betterhalf.app?subject=Better Half Support Request');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Help & Support', headerShown: true }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Help */}
        <Card style={styles.quickHelpCard}>
          <Text style={styles.quickHelpIcon}>💡</Text>
          <Text style={styles.quickHelpTitle}>Need Help?</Text>
          <Text style={styles.quickHelpText}>
            Check out our frequently asked questions below, or contact us directly for support.
          </Text>
          <TouchableOpacity style={styles.emailButton} onPress={handleEmailSupport}>
            <Text style={styles.emailButtonText}>📧 Email Support</Text>
          </TouchableOpacity>
        </Card>
        
        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <Card style={styles.faqCard}>
          {FAQ_ITEMS.map((item, index) => (
            <View key={index}>
              <TouchableOpacity 
                style={styles.faqItem} 
                onPress={() => toggleExpanded(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqToggle}>
                  {expandedIndex === index ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              
              {expandedIndex === index && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </View>
              )}
              
              {index < FAQ_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>
        
        {/* Contact Options */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        
        <Card style={styles.contactCard}>
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={handleEmailSupport}
          >
            <Text style={styles.contactIcon}>📧</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactDesc}>support@betterhalf.app</Text>
            </View>
            <Text style={styles.contactArrow}>›</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={() => Linking.openURL('https://twitter.com/betterhalf')}
          >
            <Text style={styles.contactIcon}>🐦</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Twitter</Text>
              <Text style={styles.contactDesc}>@betterhalf</Text>
            </View>
            <Text style={styles.contactArrow}>›</Text>
          </TouchableOpacity>
        </Card>
        
        {/* App Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Better Half</Text>
          <Text style={styles.infoVersion}>Version 1.0.0</Text>
          <View style={styles.infoLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://betterhalf.app/privacy')}>
              <Text style={styles.infoLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.infoDot}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://betterhalf.app/terms')}>
              <Text style={styles.infoLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
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
  quickHelpCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  quickHelpIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  quickHelpTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  quickHelpText: {
    ...typography.body,
    color: colors.textPrimarySecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emailButton: {
    backgroundColor: colors.coral,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emailButtonText: {
    ...typography.body,
    fontFamily: fontFamilies.semiBold,
    color: '#fff',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  faqCard: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    ...typography.body,
    fontFamily: fontFamilies.semiBold,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: 12,
  },
  faqToggle: {
    fontSize: 24,
    color: colors.coral,
    fontWeight: '300',
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswer: {
    ...typography.body,
    color: colors.textPrimarySecondary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardDarkBorder,
    marginHorizontal: 16,
  },
  contactCard: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    ...typography.body,
    fontFamily: fontFamilies.semiBold,
    color: colors.textPrimary,
  },
  contactDesc: {
    ...typography.caption,
    color: colors.textPrimarySecondary,
  },
  contactArrow: {
    fontSize: 24,
    color: colors.textPrimaryMuted,
  },
  infoCard: {
    padding: 24,
    alignItems: 'center',
  },
  infoTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  infoVersion: {
    ...typography.caption,
    color: colors.textPrimaryMuted,
    marginTop: 4,
  },
  infoLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  infoLink: {
    ...typography.caption,
    color: colors.coral,
  },
  infoDot: {
    color: colors.textPrimaryMuted,
    marginHorizontal: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
