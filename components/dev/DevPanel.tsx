import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useDevStore, DEV_ACCOUNTS } from '../../stores/devStore';
import { useCoupleStore } from '../../stores/coupleStore';
import { getThemeColors } from '../../constants/colors';
import { fontFamilies } from '../../constants/typography';
import { useThemeStore } from '../../stores/themeStore';

export function DevPanel() {
  const { user, signOut, signIn } = useAuthStore();
  const { cachedPassword, setDevMode } = useDevStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  const [switching, setSwitching] = useState<string | null>(null);

  const currentEmail = user?.email || '';

  const handleQuickSwitch = async (targetEmail: string) => {
    if (!cachedPassword) {
      // No cached password — sign out and let them re-login
      await signOut();
      router.replace('/(auth)/signin');
      return;
    }

    setSwitching(targetEmail);
    try {
      // Sign out current user
      await signOut();
      // Small delay to let auth state clear
      await new Promise(r => setTimeout(r, 300));
      // Sign in as the other user
      const result = await signIn(targetEmail, cachedPassword);
      if (result.error) {
        // If sign-in fails, go to login screen
        router.replace('/(auth)/signin');
      } else {
        // Reload couple data
        router.replace('/(auth)/invite');
      }
    } catch {
      router.replace('/(auth)/signin');
    } finally {
      setSwitching(null);
    }
  };

  const handleDisableDevMode = () => {
    setDevMode(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(255,107,107,0.08)' : 'rgba(232,85,85,0.06)', borderColor: isDark ? 'rgba(255,107,107,0.2)' : 'rgba(232,85,85,0.15)' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.coral }]}>🛠 Dev Panel</Text>
        <TouchableOpacity onPress={handleDisableDevMode} style={styles.closeBtn}>
          <Text style={[styles.closeBtnText, { color: themeColors.textMuted }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
        Logged in as: {currentEmail}
      </Text>

      {!cachedPassword && (
        <Text style={[styles.hint, { color: themeColors.coral }]}>
          ⚠ Sign out & back in with dev mode on to enable quick-switch
        </Text>
      )}

      <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>QUICK SWITCH</Text>
      
      <View style={styles.accountRow}>
        {DEV_ACCOUNTS.map((account) => {
          const isActive = currentEmail === account.email;
          const isLoading = switching === account.email;
          return (
            <TouchableOpacity
              key={account.email}
              style={[
                styles.accountBtn,
                { 
                  backgroundColor: isActive 
                    ? (isDark ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.1)')
                    : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  borderColor: isActive 
                    ? themeColors.purple 
                    : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                },
              ]}
              onPress={() => !isActive && !switching && handleQuickSwitch(account.email)}
              disabled={isActive || !!switching}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={themeColors.purple} />
              ) : (
                <>
                  <Text style={styles.accountEmoji}>{account.emoji}</Text>
                  <Text style={[
                    styles.accountLabel, 
                    { color: isActive ? themeColors.purple : themeColors.textPrimary }
                  ]}>
                    {account.label}
                  </Text>
                  {isActive && (
                    <Text style={[styles.activeBadge, { color: themeColors.purple }]}>●</Text>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    marginBottom: 12,
  },
  hint: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 16,
  },
  sectionLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  accountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    minHeight: 48,
  },
  accountEmoji: {
    fontSize: 18,
  },
  accountLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
  activeBadge: {
    fontSize: 8,
    marginLeft: 2,
  },
});
