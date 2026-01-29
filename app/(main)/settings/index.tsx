import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/authStore';
import { useCoupleStore } from '../../../stores/coupleStore';
import { getSupabase, TABLES } from '../../../lib/supabase';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function Settings() {
  const { user } = useAuthStore();
  const { couple, partnerProfile, reset: resetCoupleStore } = useCoupleStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const partnerName = partnerProfile?.display_name || 'Partner';

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

  const handleDisconnectPartner = async () => {
    if (!user?.id || !couple?.id) return;

    Alert.alert(
      'Disconnect Partner',
      `Are you sure you want to disconnect from ${partnerName}? This will:\n\n• Delete all your shared game history\n• Reset your streaks and stats\n• Remove your partner connection\n\nYou'll need a new invite code to connect again.`,
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Account */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem 
            icon="👤" 
            label="Edit Profile" 
            onPress={() => router.push('/(main)/settings/edit-profile')} 
          />
          <MenuItem 
            icon="🔔" 
            label="Notifications" 
            onPress={() => router.push('/(main)/settings/notifications')} 
          />
        </Card>

        {/* Game Settings */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Game</Text>
          <MenuItem 
            icon="🎯" 
            label="Question Categories" 
            onPress={() => router.push('/(main)/settings/categories')} 
          />
        </Card>

        {/* Partner Connection */}
        {couple && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Partner Connection</Text>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerLabel}>Connected with</Text>
              <Text style={styles.partnerName}>{partnerName}</Text>
              {couple.status === 'active' && (
                <Text style={styles.partnerStatus}>✓ Active</Text>
              )}
            </View>
            
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteLabel}>Your Invite Code</Text>
              <Text style={styles.inviteCode}>{couple.invite_code}</Text>
            </View>
          </Card>
        )}

        {/* Data Management */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity 
            style={styles.dangerItem}
            onPress={() => setShowResetModal(true)}
          >
            <Text style={styles.dangerIcon}>🔄</Text>
            <View style={styles.dangerContent}>
              <Text style={styles.dangerLabel}>Reset Game Data</Text>
              <Text style={styles.dangerDescription}>
                Clear all your stats and start fresh with your partner
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dangerItem, styles.dangerItemLast]}
            onPress={handleDisconnectPartner}
          >
            <Text style={styles.dangerIcon}>💔</Text>
            <View style={styles.dangerContent}>
              <Text style={[styles.dangerLabel, { color: colors.coral }]}>
                Disconnect Partner
              </Text>
              <Text style={styles.dangerDescription}>
                Remove your partner connection and delete all shared data
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Game Data?</Text>
            <Text style={styles.modalText}>
              This will clear all your game history, stats, and streaks. Your partner connection will remain.
            </Text>
            <Text style={styles.modalWarning}>This action cannot be undone.</Text>
            
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
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
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
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  menuLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
  partnerInfo: {
    marginBottom: 16,
  },
  partnerLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  partnerName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  partnerStatus: {
    ...typography.caption,
    color: colors.success,
    marginTop: 4,
  },
  inviteCodeBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  inviteLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
  },
  inviteCode: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 24,
    color: colors.purpleLight,
    letterSpacing: 4,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dangerItemLast: {
    borderBottomWidth: 0,
  },
  dangerIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  dangerContent: {
    flex: 1,
  },
  dangerLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dangerDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  aboutLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  aboutValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.cardDark,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalWarning: {
    ...typography.bodySmall,
    color: colors.coral,
    marginBottom: 24,
    textAlign: 'center',
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
