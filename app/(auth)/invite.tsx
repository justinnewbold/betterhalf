import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Share, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';

export default function Invite() {
  const { couple, createInviteCode, joinWithCode, fetchCouple } = useAuthStore();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we already have a couple
    fetchCouple();
  }, []);

  useEffect(() => {
    // If couple is active, redirect to main
    if (couple?.status === 'active') {
      router.replace('/(main)/(tabs)');
    }
  }, [couple]);

  const handleCreateCode = async () => {
    setLoading(true);
    const inviteCode = await createInviteCode();
    setLoading(false);
    if (inviteCode) {
      setCode(inviteCode);
    }
  };

  const handleShareCode = async () => {
    if (couple?.inviteCode) {
      await Share.share({
        message: `Join me on Better Half! Use my invite code: ${couple.inviteCode}\n\nDownload the app and enter this code to connect with me.`,
      });
    }
  };

  const handleJoinWithCode = async () => {
    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');
    const result = await joinWithCode(code.toUpperCase());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.replace('/(main)/(tabs)');
    }
  };

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
            onPress={() => setMode('create')}
          >
            <Text style={[styles.toggleText, mode === 'create' && styles.toggleTextActive]}>
              Invite Partner
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'join' && styles.toggleActive]}
            onPress={() => setMode('join')}
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

            {couple?.inviteCode ? (
              <>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>YOUR INVITE CODE</Text>
                  <Text style={styles.codeValue}>{couple.inviteCode}</Text>
                </View>

                <Button title="📤 Share Code" onPress={handleShareCode} fullWidth />
              </>
            ) : (
              <Button
                title="Generate Invite Code"
                onPress={handleCreateCode}
                loading={loading}
                fullWidth
              />
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>Join Your Partner</Text>
            <Text style={styles.subtitle}>Enter the invite code they shared</Text>

            <Input
              placeholder="Enter 6-digit code"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={6}
              style={styles.codeInput}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title="Join"
              onPress={handleJoinWithCode}
              loading={loading}
              fullWidth
            />
          </>
        )}

        <View style={styles.spacer} />

        <Button
          title="Sign Out"
          onPress={() => {
            useAuthStore.getState().signOut();
            router.replace('/(auth)/welcome');
          }}
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
