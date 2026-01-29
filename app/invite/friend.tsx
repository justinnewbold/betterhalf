import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useFriendsStore } from '../../stores/friendsStore';
import { colors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';
import { getSupabase, TABLES } from '../../lib/supabase';

interface InviteDetails {
  id: string;
  inviterName: string;
  relationshipType: string;
  expiresAt: string | null;
}

/**
 * Friend invite landing page
 * Handles URLs like: https://betterhalf.newbold.cloud/invite/friend?code=ABCD1234
 * Or deep links: betterhalf://invite/friend?code=ABCD1234
 * 
 * Shows a welcome screen for friend invites,
 * validates the code, and allows accepting
 */
export default function FriendInviteLanding() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { session, isLoading: authLoading } = useAuthStore();
  const { acceptFriendInvite, fetchFriends } = useFriendsStore();
  
  const [isJoining, setIsJoining] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);

  const inviteCode = params.code?.toUpperCase();

  // Validate invite code on mount
  useEffect(() => {
    if (inviteCode) {
      validateInvite();
    } else {
      setIsValidating(false);
      setError('No invite code provided');
    }
  }, [inviteCode]);

  // If user is logged in and invite is valid, show accept button
  useEffect(() => {
    if (joined && session?.user?.id) {
      // Navigate to friends tab after short delay
      setTimeout(() => {
        router.replace('/(main)/(tabs)/friends');
      }, 2000);
    }
  }, [joined, session?.user?.id]);

  const validateInvite = async () => {
    const supabase = getSupabase();
    if (!supabase || !inviteCode) {
      setIsValidating(false);
      setError('Unable to validate invite');
      return;
    }

    try {
      // Find the invite and get inviter's info
      const { data: invite, error: findError } = await supabase
        .from(TABLES.friends)
        .select(`
          id,
          user_id,
          relationship_type,
          invite_expires_at,
          initiator:betterhalf_users!betterhalf_friends_user_id_fkey(display_name)
        `)
        .eq('invite_code', inviteCode)
        .eq('status', 'pending')
        .maybeSingle();

      if (findError || !invite) {
        setError('This invite code is invalid or has already been used');
        setIsValidating(false);
        return;
      }

      // Check expiration
      if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) {
        setError('This invite has expired');
        setIsValidating(false);
        return;
      }

      // Store invite details for display
      setInviteDetails({
        id: invite.id,
        inviterName: (invite.initiator as any)?.display_name || 'Someone',
        relationshipType: invite.relationship_type,
        expiresAt: invite.invite_expires_at,
      });
      
      setIsValidating(false);
    } catch (err) {
      console.error('Error validating invite:', err);
      setError('Unable to validate invite');
      setIsValidating(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!session?.user?.id || !inviteCode) return;
    
    setIsJoining(true);
    setError('');
    
    const result = await acceptFriendInvite(session.user.id, inviteCode);
    
    if (result.error) {
      const errorMsg = typeof result.error === 'string' 
        ? result.error 
        : result.error.message || 'Failed to accept invite';
      setError(errorMsg);
      setIsJoining(false);
    } else {
      setJoined(true);
      // Refresh friends list
      fetchFriends(session.user.id);
    }
  };

  const handleGetStarted = () => {
    // Send to signup with the friend invite code
    if (inviteCode) {
      router.push({
        pathname: '/(auth)/signup',
        params: { friendInviteCode: inviteCode },
      });
    } else {
      router.push('/(auth)/welcome');
    }
  };

  const handleSignIn = () => {
    if (inviteCode) {
      router.push({
        pathname: '/(auth)/login',
        params: { friendInviteCode: inviteCode },
      });
    } else {
      router.push('/(auth)/login');
    }
  };

  const getRelationshipEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      friend: '👫',
      family: '👨‍👩‍👧‍👦',
      sibling: '👯',
      parent: '👨‍👧',
      child: '👶',
      cousin: '🤝',
      other: '💫',
    };
    return emojis[type] || '👋';
  };

  const getRelationshipLabel = (type: string) => {
    const labels: Record<string, string> = {
      friend: 'Friend',
      family: 'Family',
      sibling: 'Sibling',
      parent: 'Parent',
      child: 'Child',
      cousin: 'Cousin',
      other: 'Connection',
    };
    return labels[type] || 'Friend';
  };

  // Show loading while checking auth or validating
  if (authLoading || isValidating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>
            {isValidating ? 'Validating invite...' : 'Loading...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If joining
  if (isJoining) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Accepting invite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If joined successfully
  if (joined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.successTitle}>You're Connected!</Text>
          <Text style={styles.successSubtitle}>
            You and {inviteDetails?.inviterName} are now friends on Better Half
          </Text>
          <Text style={styles.redirectText}>Redirecting to Friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state (no valid invite)
  if (error && !inviteDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Invalid Invite</Text>
          <Text style={styles.errorText}>{error}</Text>
          
          <View style={{ height: 32 }} />
          
          <Button 
            title="Go to Home" 
            onPress={() => router.replace('/')}
            fullWidth 
          />
        </View>
      </SafeAreaView>
    );
  }

  // Main invite landing UI
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircles}>
            <LinearGradient 
              colors={[colors.coral, colors.coralLight]} 
              style={[styles.circle, styles.circleLeft]} 
            />
            <LinearGradient 
              colors={['#10B981', '#34D399']} 
              style={[styles.circle, styles.circleRight]} 
            />
          </View>
        </View>

        {/* Invitation Message */}
        <Text style={styles.inviteEmoji}>
          {getRelationshipEmoji(inviteDetails?.relationshipType || 'friend')}
        </Text>
        <Text style={styles.title}>Friend Invite!</Text>
        <Text style={styles.subtitle}>
          <Text style={styles.inviterName}>{inviteDetails?.inviterName}</Text>
          {' '}wants to connect with you as{' '}
          <Text style={styles.relationshipType}>
            {getRelationshipLabel(inviteDetails?.relationshipType || 'friend')}
          </Text>
        </Text>

        {inviteCode && (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>INVITE CODE</Text>
            <Text style={styles.codeValue}>{inviteCode}</Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Feature Highlights for Friends */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🎮</Text>
            <Text style={styles.featureText}>Play daily question games together</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>💬</Text>
            <Text style={styles.featureText}>Answer fun questions about each other</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🏆</Text>
            <Text style={styles.featureText}>See how well you know each other</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Action Buttons */}
        {session ? (
          // Logged in - show accept button
          <>
            <Button 
              title="Accept Friend Invite" 
              onPress={handleAcceptInvite}
              loading={isJoining}
              disabled={isJoining || !inviteCode}
              fullWidth 
            />
            <View style={{ height: 12 }} />
            <Button 
              title="Go to Friends" 
              onPress={() => router.replace('/(main)/(tabs)/friends')}
              variant="secondary"
              fullWidth 
            />
          </>
        ) : (
          // Not logged in - show signup/signin
          <>
            <Button 
              title="Sign Up to Accept" 
              onPress={handleGetStarted}
              fullWidth 
            />
            <View style={{ height: 12 }} />
            <Button 
              title="I Already Have an Account" 
              onPress={handleSignIn}
              variant="secondary"
              fullWidth 
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 16,
  },
  inviteEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
    fontSize: 17,
  },
  inviterName: {
    color: colors.coral,
    fontFamily: fontFamilies.bodyBold,
  },
  relationshipType: {
    color: '#10B981',
    fontFamily: fontFamilies.bodyBold,
  },
  codeBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  codeValue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 28,
    color: '#10B981',
    letterSpacing: 4,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  features: {
    marginTop: 8,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  redirectText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
