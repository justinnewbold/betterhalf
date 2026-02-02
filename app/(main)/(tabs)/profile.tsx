import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { useThemeStore } from '../../../stores/themeStore';
import { colors, getThemeColors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function Profile() {
  const { user, signOut } = useAuthStore();
  const { couple, partnerProfile, stats, streak: streakData, reset: resetCoupleStore } = useCoupleStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);

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

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { 
      flex: 1, 
      backgroundColor: themeColors.background 
    },
    avatarBorder: {
      borderColor: themeColors.background,
    },
    names: { 
      fontFamily: fontFamilies.bodySemiBold, 
      fontSize: 22, 
      color: themeColors.textPrimary, 
      marginBottom: 4 
    },
    since: { 
      ...typography.bodySmall, 
      color: themeColors.textMuted, 
      marginBottom: 24 
    },
    statValue: { 
      fontFamily: fontFamilies.bodyBold, 
      fontSize: 28, 
      color: themeColors.purpleLight, 
      marginBottom: 2 
    },
    statLabel: { 
      ...typography.caption, 
      color: themeColors.textMuted 
    },
    menuItemBorder: { 
      borderBottomWidth: 1, 
      borderBottomColor: themeColors.cardBorder 
    },
    menuLabel: { 
      ...typography.body, 
      color: themeColors.textPrimary, 
      flex: 1 
    },
    menuArrow: { 
      fontSize: 20, 
      color: themeColors.textMuted 
    },
    version: { 
      ...typography.caption, 
      color: themeColors.textFaint, 
      marginTop: 24 
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.avatarPair}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={[styles.avatarImage, dynamicStyles.avatarBorder]} />
          ) : (
            <LinearGradient colors={[themeColors.coral, themeColors.coralLight]} style={[styles.avatar, dynamicStyles.avatarBorder]}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
          {connectionAvatar ? (
            <Image source={{ uri: connectionAvatar }} style={[styles.avatarImage, styles.avatarRight, dynamicStyles.avatarBorder]} />
          ) : (
            <LinearGradient colors={[themeColors.purple, themeColors.purpleLight]} style={[styles.avatar, styles.avatarRight, dynamicStyles.avatarBorder]}>
              <Text style={styles.avatarText}>{connectionName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
        </View>

        <Text style={dynamicStyles.names}>{userName} & {connectionName}</Text>
        <Text style={dynamicStyles.since}>{formatAnniversary()}</Text>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={dynamicStyles.statValue}>{streakData?.current_streak || 0}</Text>
              <Text style={dynamicStyles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[dynamicStyles.statValue, { color: themeColors.coral }]}>{stats?.total_games || 0}</Text>
              <Text style={dynamicStyles.statLabel}>Games</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[dynamicStyles.statValue, { color: themeColors.success }]}>0</Text>
              <Text style={dynamicStyles.statLabel}>Badges</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.menuCard}>
          <MenuItem icon="⚙️" label="Settings" onPress={() => router.push('/(main)/settings')} themeColors={themeColors} />
          <MenuItem icon="🏆" label="Achievements" onPress={() => router.push('/(main)/settings/achievements')} themeColors={themeColors} />
          <MenuItem icon="🔔" label="Notifications" onPress={() => router.push('/(main)/settings/notifications')} themeColors={themeColors} />
          <MenuItem icon="💜" label="Upgrade to Premium" onPress={() => router.push('/(main)/settings/premium')} themeColors={themeColors} isLast />
        </Card>

        <Card style={styles.menuCard}>
          <MenuItem icon="❓" label="Help & Support" onPress={() => router.push('/(main)/settings/help')} themeColors={themeColors} />
          <MenuItem icon="📝" label="Send Feedback" onPress={() => router.push('/(main)/settings/feedback')} themeColors={themeColors} isLast />
        </Card>

        <Button title="Sign Out" onPress={handleSignOut} variant="ghost" style={styles.signOutButton} />
        <Text style={dynamicStyles.version}>Better Half v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  themeColors: ReturnType<typeof getThemeColors>;
  isLast?: boolean;
}

function MenuItem({ icon, label, onPress, themeColors, isLast }: MenuItemProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.menuItem, 
        !isLast && { borderBottomWidth: 1, borderBottomColor: themeColors.cardBorder }
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabelBase, { color: themeColors.textPrimary }]}>{label}</Text>
      <Text style={[styles.menuArrowBase, { color: themeColors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  avatarPair: { flexDirection: 'row', marginTop: 20, marginBottom: 16 },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  avatarImage: { width: 70, height: 70, borderRadius: 35, borderWidth: 3 },
  avatarRight: { marginLeft: -20 },
  avatarText: { fontFamily: fontFamilies.bodyBold, fontSize: 28, color: colors.textPrimary },
  statsCard: { width: '100%', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  menuCard: { width: '100%', marginBottom: 16, padding: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabelBase: { ...typography.body, flex: 1 },
  menuArrowBase: { fontSize: 20 },
  signOutButton: { marginTop: 8 },
});
