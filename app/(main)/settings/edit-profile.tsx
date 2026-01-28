import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useAuthStore } from '../../../stores/authStore';
import { getSupabase, TABLES } from '../../../lib/supabase';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function EditProfile() {
  const { user, updateProfile } = useAuthStore();
  
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Update display name
      if (displayName !== user?.display_name) {
        const { error: profileError } = await updateProfile({ display_name: displayName });
        if (profileError) throw profileError;
      }

      // Update email if changed
      if (email !== user?.email) {
        const supabase = getSupabase();
        if (supabase) {
          const { error: emailError } = await supabase.auth.updateUser({ email });
          if (emailError) throw emailError;
        }
      }

      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Not connected');

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) throw passwordError;

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const userInitial = user?.display_name?.charAt(0).toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={[colors.coral, colors.coralLight]} style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </LinearGradient>
          )}
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Coming soon</Text>
        </View>

        {/* Error/Success Messages */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        {/* Profile Info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            autoCapitalize="words"
          />

          <View style={styles.spacer} />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.buttonRow}>
            <Button
              title={isLoading ? "Saving..." : "Save Changes"}
              onPress={handleSaveProfile}
              disabled={isLoading}
              fullWidth
            />
          </View>
        </Card>

        {/* Change Password */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            secureTextEntry
          />

          <View style={styles.spacer} />

          <Input
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
          />

          <View style={styles.buttonRow}>
            <Button
              title={isLoading ? "Updating..." : "Update Password"}
              onPress={handleChangePassword}
              disabled={isLoading}
              variant="secondary"
              fullWidth
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 40,
    color: colors.textPrimary,
  },
  changePhotoButton: {
    marginTop: 12,
  },
  changePhotoText: {
    ...typography.body,
    color: colors.purpleLight,
  },
  photoHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.coral,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: 'rgba(76,217,100,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    ...typography.bodySmall,
    color: colors.success,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  spacer: {
    height: 12,
  },
  buttonRow: {
    marginTop: 20,
  },
});
