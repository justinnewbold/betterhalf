import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { useThemeStore } from '../../../stores/themeStore';
import { useAchievementStore } from '../../../stores/achievementStore';
import { getSupabase, TABLES } from '../../../lib/supabase';
import { colors, getThemeColors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function Settings() {
  const { user } = useAuthStore();
  const { couple, partnerProfile, reset: resetCoupleStore } = useCoupleStore();
  const { mode: themeMode, isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  const { achievements, userAchievements } = useAchievementStore();
  const unlockedCount = userAchievements.length;
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const connectionName = partnerProfile?.display_name || 'Your Person';

  const getThemeModeLabel = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'Dark';
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleResetCouple = async () => {
    if (!user?.id || !couple?.id) return;

    setIsResetting(true);

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Not connected');

      // Delete all daily sessions for this couple
      await supabase
        .from('betterhalf_daily_sessions')
        .delete()
        .eq('couple_id', couple.id);

      // Delete game sessions
      await supabase
        .from(TABLES.game_sessions)
        .delete()
        .eq('couple_id', couple.id);

      // Delete answers (cascade should handle this, but just in case)
      
      // Reset couple stats
      await supabase
        .from(TABLES.couple_stats)
        .update({
          total_games: 0,
          total_matches: 0,
          total_questions: 0,
          sync_score: 0,
        })
        .eq('couple_id', couple.id);

      // Reset streaks
      await supabase
        .from(TABLES.streaks)
        .update({
          current_streak: 0,
          longest_streak: 0,
          last_played_at: null,
        })
        .eq('couple_id', couple.id);

      // Refresh stores
      resetCoupleStore();
      
      setShowResetModal(false);
      Alert.alert('Success', 'Your game data has been reset. Start fresh!');
      
      // Go back to profile
      router.back();
    } catch (err: any) {
      console.error('[Settings] Reset error:', err);
      Alert.alert('Error', err.message || 'Failed to reset data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id || !couple?.id) return;

    Alert.alert(
      'Disconnect',
      `Are you sure you want to disconnect from ${connectionName}? This will:\n\n• Delete all your shared game history\n• Reset your streaks and stats\n• Remove your connection\n\nYou'll need a new invite code to connect again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              const supabase = getSupabase();
              if (!supabase) throw new Error('Not connected');

              // Delete all related data
              await supabase.from('betterhalf_daily_sessions').delete().eq('couple_id', couple.id);
              await supabase.from(TABLES.game_sessions).delete().eq('couple_id', couple.id);
              await supabase.from(TABLES.couple_stats).delete().eq('couple_id', couple.id);
              await supabase.from(TABLES.streaks).delete().eq('couple_id', couple.id);
              await supabase.from(TABLES.custom_questions).delete().eq('couple_id', couple.id);
              
              // Delete the couple
              await supabase.from(TABLES.couples).delete().eq('id', couple.id);

              // Reset store and navigate
              resetCoupleStore();
              router.replace('/(auth)/invite');
            } catch (err: any) {
              console.error('[Settings] Disconnect error:', err);
              Alert.alert('Error', err.message || 'Failed to disconnect');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    closeButton: {
      fontSize: 20,
      color: themeColors.textMuted,
      padding: 4,
    },
    headerTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 17,
      color: themeColors.textPrimary,
    },
    sectionTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: themeColors.textMuted,
      marginBottom: 12,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    menuLabel: {
      ...typography.body,
      color: themeColors.textPrimary,
    },
    menuSubtitle: {
      ...typography.caption,
      color: themeColors.textMuted,
      marginTop: 2,
    },
    menuArrow: {
      fontSize: 20,
      color: themeColors.textMuted,
    },
    partnerLabel: {
      ...typography.caption,
      color: themeColors.textMuted,
      marginBottom: 4,
    },
    partnerName: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 18,
      color: themeColors.textPrimary,
    },
    partnerStatus: {
      ...typography.caption,
      color: themeColors.success,
      marginTop: 4,
    },
    inviteCodeBox: {
      backgroundColor: themeColors.inputBackground,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center' as const,
    },
    inviteLabel: {
      ...typography.caption,
      color: themeColors.textMuted,
      marginBottom: 8,
    },
    inviteCode: {
      fontFamily: fontFamilies.bodyBold,
      fontSize: 24,
      color: themeColors.purpleLight,
      letterSpacing: 4,
    },
    dangerItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.cardBorder,
    },
    dangerLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
      color: themeColors.textPrimary,
      marginBottom: 4,
    },
    dangerDescription: {
      ...typography.bodySmall,
      color: themeColors.textMuted,
    },
    aboutLabel: {
      ...typography.body,
      color: themeColors.textMuted,
    },
    aboutValue: {
      ...typography.body,
      color: themeColors.textPrimary,
    },
    modalContent: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 340,
    },
    modalTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 20,
      color: themeColors.textPrimary,
      marginBottom: 12,
      textAlign: 'center' as const,
    },
    modalText: {
      ...typography.body,
      color: themeColors.textSecondary,
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    modalWarning: {
      ...typography.bodySmall,
      color: themeColors.coral,
      marginBottom: 24,
      textAlign: 'center' as const,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={dynamicStyles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Account */}
        <Card style={styles.card}>
          <Text style={dynamicStyles.sectionTitle}>Account</Text>
          <MenuItem 
            icon="👤" 
            label="Edit Profile" 
            onPress={() => router.push('/(main)/settings/edit-profile')}
            themeColors={themeColors}
          />
          <MenuItem 
            icon="🔔" 
            label="Notifications" 
            onPress={() => router.push('/(main)/settings/notifications')}
            themeColors={themeColors}
          />
          <MenuItem 
            icon="🎨" 
            label="Appearance" 
            subtitle={getThemeModeLabel()}
            onPress={() => router.push('/(main)/settings/appearance')}
            themeColors={themeColors}
          />
        </Card>

        {/* Game Settings */}
        <Card style={styles.card}>
          <Text style={dynamicStyles.sectionTitle}>Game</Text>
          <MenuItem 
            icon="🎯" 
            label="Question Categories" 
            onPress={() => router.push('/(main)/settings/categories')}
            themeColors={themeColors}
          />
          <MenuItem 
            icon="✨" 
            label="Custom Questions" 
            subtitle="Create your own questions"
            onPress={() => router.push('/(main)/settings/custom-questions')}
            themeColors={themeColors}
          />
          <MenuItem 
            icon="📚" 
            label="Question History" 
            subtitle="View past answers"
            onPress={() => router.push('/(main)/settings/history')}
            themeColors={themeColors}
          />
          <MenuItem 
            icon="🏆" 
            label="Achievements" 
            subtitle={`${unlockedCount}/${achievements.length} unlocked`}
            onPress={() => router.push('/(main)/settings/achievements')}
            themeColors={themeColors}
          />
        </Card>

        {/* Connection */}
        {couple && (
          <Card style={styles.card}>
            <Text style={dynamicStyles.sectionTitle}>Connection</Text>
            <View style={styles.partnerInfo}>
              <Text style={dynamicStyles.partnerLabel}>Connected with</Text>
              <Text style={dynamicStyles.partnerName}>{connectionName}</Text>
              {couple.status === 'active' && (
                <Text style={dynamicStyles.partnerStatus}>✓ Active</Text>
              )}
            </View>
            
            <View style={dynamicStyles.inviteCodeBox}>
              <Text style={dynamicStyles.inviteLabel}>Your Invite Code</Text>
              <Text style={dynamicStyles.inviteCode}>{couple.invite_code}</Text>
            </View>
          </Card>
        )}

        {/* Data Management */}
        <Card style={styles.card}>
          <Text style={dynamicStyles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity 
            style={dynamicStyles.dangerItem}
            onPress={() => setShowResetModal(true)}
          >
            <Text style={styles.dangerIcon}>🔄</Text>
            <View style={styles.dangerContent}>
              <Text style={dynamicStyles.dangerLabel}>Reset Game Data</Text>
              <Text style={dynamicStyles.dangerDescription}>
                Clear all your stats and start fresh
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[dynamicStyles.dangerItem, styles.dangerItemLast]}
            onPress={handleDisconnect}
          >
            <Text style={styles.dangerIcon}>🔗</Text>
            <View style={styles.dangerContent}>
              <Text style={[dynamicStyles.dangerLabel, { color: themeColors.coral }]}>
                Disconnect
              </Text>
              <Text style={dynamicStyles.dangerDescription}>
                Remove your connection and delete all shared data
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <Text style={dynamicStyles.sectionTitle}>About</Text>
          <View style={styles.aboutRow}>
            <Text style={dynamicStyles.aboutLabel}>Version</Text>
            <Text style={dynamicStyles.aboutValue}>1.2.0</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Reset Game Data?</Text>
            <Text style={dynamicStyles.modalText}>
              This will clear all your game history, stats, and streaks. Your connection will remain.
            </Text>
            <Text style={dynamicStyles.modalWarning}>This action cannot be undone.</Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowResetModal(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title={isResetting ? "Resetting..." : "Reset Data"}
                onPress={handleResetCouple}
                disabled={isResetting}
                style={[styles.modalButton, styles.modalButtonDanger]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  themeColors: ReturnType<typeof getThemeColors>;
}

function MenuItem({ icon, label, subtitle, onPress, themeColors }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabelBase, { color: themeColors.textPrimary }]}>{label}</Text>
        {subtitle && <Text style={[styles.menuSubtitleBase, { color: themeColors.textMuted }]}>{subtitle}</Text>}
      </View>
      <Text style={[styles.menuArrowBase, { color: themeColors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabelBase: {
    ...typography.body,
  },
  menuSubtitleBase: {
    ...typography.caption,
    marginTop: 2,
  },
  menuArrowBase: {
    fontSize: 20,
  },
  partnerInfo: {
    marginBottom: 16,
  },
  dangerIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  dangerContent: {
    flex: 1,
  },
  dangerItemLast: {
    borderBottomWidth: 0,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  modalButtonDanger: {
    backgroundColor: colors.coral,
  },
});
