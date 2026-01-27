import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/authStore';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function Profile() {
  const { user, couple, signOut } = useAuthStore();

  const userName = user?.user_metadata?.display_name || 'You';
  const partnerName = couple?.partnerName || 'Partner';

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Avatar Pair */}
        <View style={styles.avatarPair}>
          <LinearGradient colors={[colors.coral, colors.coralLight]} style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.avatar, styles.avatarRight]}>
            <Text style={styles.avatarText}>{partnerName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.names}>{userName} & {partnerName}</Text>
        <Text style={styles.since}>Together since March 2015</Text>

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.coral }]}>43</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>12</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <MenuItem icon="⚙️" label="Settings" onPress={() => {}} />
          <MenuItem icon="🏆" label="Achievements" onPress={() => {}} />
          <MenuItem icon="🔔" label="Notifications" onPress={() => {}} />
          <MenuItem icon="💜" label="Upgrade to Premium" onPress={() => {}} isLast />
        </Card>

        <Card style={styles.menuCard}>
          <MenuItem icon="❓" label="Help & Support" onPress={() => {}} />
          <MenuItem icon="📝" label="Send Feedback" onPress={() => {}} isLast />
        </Card>

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="ghost"
          style={styles.signOutButton}
        />

        <Text style={styles.version}>Better Half v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}

function MenuItem({ icon, label, onPress, isLast }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarPair: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.darkBg,
  },
  avatarRight: {
    marginLeft: -20,
  },
  avatarText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 28,
    color: colors.textPrimary,
  },
  names: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  since: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: 24,
  },
  statsCard: {
    width: '100%',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 28,
    color: colors.purpleLight,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  menuCard: {
    width: '100%',
    marginBottom: 16,
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
  signOutButton: {
    marginTop: 8,
  },
  version: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 24,
  },
});
