import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

interface Feature {
  icon: string;
  title: string;
  description: string;
  isPremium: boolean;
}

const FEATURES: Feature[] = [
  { icon: '💬', title: 'Daily Questions', description: 'Answer daily sync questions together', isPremium: false },
  { icon: '🔥', title: 'Streak Tracking', description: 'Track your daily connection streak', isPremium: false },
  { icon: '📊', title: 'Basic Stats', description: 'See your match rate and history', isPremium: false },
  { icon: '🌙', title: 'Date Night Mode', description: 'Special deep conversation questions', isPremium: true },
  { icon: '🎨', title: 'Custom Themes', description: 'Personalize your app appearance', isPremium: true },
  { icon: '📝', title: 'Custom Questions', description: 'Create your own questions', isPremium: true },
  { icon: '📈', title: 'Advanced Analytics', description: 'Deep insights into your relationship', isPremium: true },
  { icon: '👥', title: 'Friends & Family', description: 'Play with friends and family too', isPremium: true },
  { icon: '🚫', title: 'Ad-Free Experience', description: 'No interruptions, ever', isPremium: true },
  { icon: '⭐', title: 'Priority Support', description: 'Get help when you need it', isPremium: true },
];

export default function PremiumScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Upgrade to Premium', headerShown: true }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>💜</Text>
          <Text style={styles.heroTitle}>Better Half Premium</Text>
          <Text style={styles.heroSubtitle}>Deepen your connection</Text>
        </View>
        
        {/* Coming Soon Banner */}
        <Card style={styles.comingSoonCard}>
          <Text style={styles.comingSoonIcon}>🚀</Text>
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            Premium features are currently in development. Sign up to be notified when they launch!
          </Text>
          <Button 
            title="Notify Me" 
            onPress={() => {}} 
            style={styles.notifyButton}
          />
        </Card>
        
        {/* Features Comparison */}
        <Text style={styles.sectionTitle}>Compare Plans</Text>
        
        <Card style={styles.featuresCard}>
          <View style={styles.planHeader}>
            <View style={styles.planColumn}>
              <Text style={styles.planName}>Free</Text>
            </View>
            <View style={[styles.planColumn, styles.premiumColumn]}>
              <Text style={[styles.planName, styles.premiumText]}>Premium</Text>
            </View>
          </View>
          
          {FEATURES.map((feature, index) => (
            <View 
              key={feature.title} 
              style={[
                styles.featureRow, 
                index === FEATURES.length - 1 && styles.lastRow
              ]}
            >
              <View style={styles.featureInfo}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
              </View>
              <View style={styles.checkColumns}>
                <View style={styles.checkColumn}>
                  <Text style={styles.check}>
                    {!feature.isPremium ? '✓' : '—'}
                  </Text>
                </View>
                <View style={[styles.checkColumn, styles.premiumCheckColumn]}>
                  <Text style={[styles.check, styles.premiumCheck]}>✓</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
        
        {/* Pricing Preview */}
        <Text style={styles.sectionTitle}>Planned Pricing</Text>
        
        <View style={styles.pricingRow}>
          <Card style={styles.pricingCard}>
            <Text style={styles.pricingPeriod}>Monthly</Text>
            <Text style={styles.pricingAmount}>$4.99</Text>
            <Text style={styles.pricingNote}>per month</Text>
          </Card>
          
          <Card style={[styles.pricingCard, styles.pricingCardBest]}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Best Value</Text>
            </View>
            <Text style={styles.pricingPeriod}>Yearly</Text>
            <Text style={styles.pricingAmount}>$29.99</Text>
            <Text style={styles.pricingNote}>per year</Text>
            <Text style={styles.savingsText}>Save 50%</Text>
          </Card>
        </View>
        
        <Text style={styles.disclaimer}>
          Prices shown are tentative and may change at launch.
        </Text>
        
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
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textPrimarySecondary,
  },
  comingSoonCard: {
    margin: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.coral,
  },
  comingSoonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  comingSoonTitle: {
    ...typography.h2,
    color: colors.coral,
    marginBottom: 8,
  },
  comingSoonText: {
    ...typography.body,
    color: colors.textPrimarySecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  notifyButton: {
    minWidth: 150,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  featuresCard: {
    marginHorizontal: 16,
    padding: 0,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.cardDarkBorder,
  },
  planColumn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  premiumColumn: {
    backgroundColor: colors.coral + '10',
  },
  planName: {
    ...typography.body,
    fontFamily: fontFamilies.semiBold,
    color: colors.textPrimarySecondary,
  },
  premiumText: {
    color: colors.coral,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardDarkBorder,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  featureInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
  },
  featureDesc: {
    ...typography.caption,
    color: colors.textPrimaryMuted,
    fontSize: 11,
  },
  checkColumns: {
    flexDirection: 'row',
  },
  checkColumn: {
    width: 50,
    alignItems: 'center',
  },
  premiumCheckColumn: {
    backgroundColor: colors.coral + '10',
  },
  check: {
    fontSize: 16,
    color: colors.textPrimaryMuted,
  },
  premiumCheck: {
    color: colors.coral,
  },
  pricingRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  pricingCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  pricingCardBest: {
    borderWidth: 2,
    borderColor: colors.coral,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: colors.coral,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    ...typography.caption,
    fontFamily: fontFamilies.semiBold,
    color: '#fff',
  },
  pricingPeriod: {
    ...typography.body,
    color: colors.textPrimarySecondary,
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
  },
  pricingNote: {
    ...typography.caption,
    color: colors.textPrimaryMuted,
  },
  savingsText: {
    ...typography.caption,
    color: colors.success,
    fontFamily: fontFamilies.semiBold,
    marginTop: 8,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textPrimaryMuted,
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 16,
  },
  bottomPadding: {
    height: 40,
  },
});
