import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Share, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { useCoupleStore } from '../../stores/coupleStore';
import { colors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';

export default function Invite() {
  const { session, signOut } = useAuthStore();
  const { couple, isLoading, hasFetched, fetchCouple, createCouple, joinCouple } = useCoupleStore();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Fetch couple if not already fetched
    if (session?.user?.id && !hasFetched) {
      fetchCouple(session.user.id);
    }
  }, [session?.user?.id, hasFetched]);

  useEffect(() => {
    // If couple is active, redirect to main
    if (couple?.status === 'active') {
      router.replace('/(main)/(tabs)');
    }
  }, [couple]);

  const handleCreateCode = async () => {
    if (!session?.user?.id) return;
    
    setActionLoading(true);
    setError('');
    const result = await createCouple(session.user.id);
    setActionLoading(false);
    
    if (result.error) {
      setError(result.error.message || 'Failed to create invite code');
    }
  };

  const handleShareCode = async () => {
    if (couple?.invite_code) {
      await Share.share({
        message: `Join me on Better Half! Use my invite code: ${couple.invite_code}\n\nDownload the app and enter this code to connect with me.`,
      });
    }
  };

  const handleJoinWithCode = async () => {
    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }
    
    if (!session?.user?.id) return;

    setActionLoading(true);
    setError('');
    const result = await joinCouple(session.user.id, code.toUpperCase());
    setActionLoading(false);

    if (result.error) {
      setError(result.error.message || 'Invalid or expired code');
    }
    // If successful, the useEffect watching couple will redirect
  };

  const handleSignOut = async () => {
    // Reset couple store before signing out
    const coupleStore = useCoupleStore.getState();
    coupleStore.reset();
    await signOut();
    router.replace('/(auth)/welcome');
  };

  // Show loading while fetching couple data
  if (isLoading || !hasFetched) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircles}>
            <LinearGradient colors={[colors.coral, colors.coralLight]} style={[styles.circle, styles.circleLeft]} />
            <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.circle, styles.circleRight]} />
          </View>
        </View>

        {/* Mode Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'create' && styles.toggleActive]}
            onPress={() => { setMode('create'); setError(''); }}
          >
            <Text style={[styles.toggleText, mode === 'create' && styles.toggleTextActive]}>
              Invite Partner
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'join' && styles.toggleActive]}
            onPress={() => { setMode('join'); setError(''); }}
          >
            <Text style={[styles.toggleText, mode === 'join' && styles.toggleTextActive]}>
              Enter Code
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'create' ? (
          <>
            <Text style={styles.title}>Invite Your Partner</Text>
            <Text style={styles.subtitle}>Share this code with your better half</Text>

            {couple?.invite_code ? (
              <>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>YOUR INVITE CODE</Text>
                  <Text style={styles.codeValue}>{couple.invite_code}</Text>
                </View>

                <Button title="📤 Share Code" onPress={handleShareCode} fullWidth />
              </>
            ) : (
              <>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button
                  title={actionLoading ? "Creating..." : "Generate Invite Code"}
                  onPress={handleCreateCode}
                  loading={actionLoading}
                  disabled={actionLoading}
                  fullWidth
                />
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>Join Your Partner</Text>
            <Text style={styles.subtitle}>Enter the invite code they shared</Text>

            <Input
              placeholder="Enter 6-digit code"
              value={code}
              onChangeText={(text) => { setCode(text); setError(''); }}
              autoCapitalize="characters"
              maxLength={6}
              style={styles.codeInput}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title={actionLoading ? "Joining..." : "Join"}
              onPress={handleJoinWithCode}
              loading={actionLoading}
              disabled={actionLoading}
              fullWidth
            />
          </>
        )}

        <View style={styles.spacer} />

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="ghost"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircles: {
    width: 60,
    height: 40,
    position: 'relative',
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    position: 'absolute',
  },
  circleLeft: {
    left: 0,
  },
  circleRight: {
    right: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.cardDark,
  },
  toggleText: {
    ...typography.label,
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 26,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
  },
  codeValue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 32,
    color: colors.purpleLight,
    letterSpacing: 4,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  spacer: {
    flex: 1,
  },
});
