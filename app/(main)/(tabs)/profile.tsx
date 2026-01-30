import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function Profile() {
  const { user, signOut } = useAuthStore();
  const { couple, partnerProfile, stats, streak: streakData, reset: resetCoupleStore } = useCoupleStore();

  const userName = user?.display_name || 'You';
  const connectionName = partnerProfile?.display_name || 'Your Person';
  const userAvatar = user?.avatar_url;
  const connectionAvatar = partnerProfile?.avatar_url;

  const formatAnniversary = () => {
    if (!couple?.anniversary_date) return 'Set your anniversary';
    const date = new Date(couple.anniversary_date);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleSignOut = async () => {
    resetCoupleStore();
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.avatarPair}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
          ) : (
            <LinearGradient colors={[colors.coral, colors.coralLight]} style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
          {connectionAvatar ? (
            <Image source={{ uri: connectionAvatar }} style={[styles.avatarImage, styles.avatarRight]} />
          ) : (
            <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.avatar, styles.avatarRight]}>
              <Text style={styles.avatarText}>{connectionName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
        </View>

        <Text style={styles.names}>{userName} & {connectionName}</Text>
        <Text style={styles.since}>{formatAnniversary()}</Text>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakData?.current_streak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.coral }]}>{stats?.total_games || 0}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>0</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.menuCard}>
          <MenuItem icon="⚙️" label="Settings" onPress={() => router.push('/(main)/settings')} />
          <MenuItem icon="🏆" label="Achievements" onPress={() => router.push('/(main)/settings/achievements')} />
          <MenuItem icon="🔔" label="Notifications" onPress={() => router.push('/(main)/settings/notifications')} />
          <MenuItem icon="💜" label="Upgrade to Premium" onPress={() => router.push('/(main)/settings/premium')} isLast />
        </Card>

        <Card style={styles.menuCard}>
          <MenuItem icon="❓" label="Help & Support" onPress={() => router.push('/(main)/settings/help')} />
          <MenuItem icon="📝" label="Send Feedback" onPress={() => router.push('/(main)/settings/feedback')} isLast />
        </Card>

        <Button title="Sign Out" onPress={handleSignOut} variant="ghost" style={styles.signOutButton} />
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
    <TouchableOpacity style={[styles.menuItem, !isLast && styles.menuItemBorder]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.darkBg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  avatarPair: { flexDirection: 'row', marginTop: 20, marginBottom: 16 },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.darkBg },
  avatarImage: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: colors.darkBg },
  avatarRight: { marginLeft: -20 },
  avatarText: { fontFamily: fontFamilies.bodyBold, fontSize: 28, color: colors.textPrimary },
  names: { fontFamily: fontFamilies.bodySemiBold, fontSize: 22, color: colors.textPrimary, marginBottom: 4 },
  since: { ...typography.bodySmall, color: colors.textMuted, marginBottom: 24 },
  statsCard: { width: '100%', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontFamily: fontFamilies.bodyBold, fontSize: 28, color: colors.purpleLight, marginBottom: 2 },
  statLabel: { ...typography.caption, color: colors.textMuted },
  menuCard: { width: '100%', marginBottom: 16, padding: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  menuArrow: { fontSize: 20, color: colors.textMuted },
  signOutButton: { marginTop: 8 },
  version: { ...typography.caption, color: colors.textFaint, marginTop: 24 },
});
