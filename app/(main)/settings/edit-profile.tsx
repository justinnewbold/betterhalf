import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useAuthStore } from '../../../stores/authStore';
import { useThemeStore } from '../../../stores/themeStore';
import { getSupabase, TABLES } from '../../../lib/supabase';
import { colors, getThemeColors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';

export default function EditProfile() {
  const { user, updateProfile } = useAuthStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  
  // Web file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dynamicStyles = {
    container: {
      backgroundColor: themeColors.background,
    },
    closeButton: {
      color: themeColors.textMuted,
    },
    headerTitle: {
      color: themeColors.textPrimary,
    },
    avatarText: {
      color: themeColors.textPrimary,
    },
    cameraIcon: {
      backgroundColor: themeColors.purpleLight,
      borderColor: themeColors.background,
    },
    changePhotoText: {
      color: themeColors.purpleLight,
    },
    sectionTitle: {
      color: themeColors.textPrimary,
    },
  };

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

  const handlePickImage = async () => {
    setError(null);
    
    if (Platform.OS === 'web') {
      // Use native file input on web
      fileInputRef.current?.click();
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access photos is required');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const handleWebFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Create local preview
    const localUri = URL.createObjectURL(file);
    setLocalAvatarUri(localUri);

    await uploadImageFile(file);
  };

  const uploadImage = async (uri: string) => {
    setIsUploadingPhoto(true);
    setError(null);

    try {
      const supabase = getSupabase();
      if (!supabase || !user?.id) throw new Error('Not connected');

      // Fetch the image and convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Generate filename
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('betterhalf-avatars')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('betterhalf-avatars')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: profileError } = await updateProfile({ avatar_url: publicUrl });
      if (profileError) throw profileError;

      setLocalAvatarUri(uri);
      setSuccess('Profile photo updated!');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload photo');
      setLocalAvatarUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const uploadImageFile = async (file: File) => {
    setIsUploadingPhoto(true);
    setError(null);

    try {
      const supabase = getSupabase();
      if (!supabase || !user?.id) throw new Error('Not connected');

      // Generate filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('betterhalf-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('betterhalf-avatars')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: profileError } = await updateProfile({ avatar_url: publicUrl });
      if (profileError) throw profileError;

      setSuccess('Profile photo updated!');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload photo');
      setLocalAvatarUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const userInitial = user?.display_name?.charAt(0).toUpperCase() || 'U';
  const displayAvatarUri = localAvatarUri || user?.avatar_url;

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      {/* Hidden file input for web */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          onChange={handleWebFileSelect as any}
          style={{ display: 'none' }}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={[styles.closeButton, dynamicStyles.closeButton]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploadingPhoto}>
            <View style={styles.avatarContainer}>
              {displayAvatarUri ? (
                <Image source={{ uri: displayAvatarUri }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={[themeColors.coral, themeColors.coralLight]} style={styles.avatar}>
                  <Text style={[styles.avatarText, dynamicStyles.avatarText]}>{userInitial}</Text>
                </LinearGradient>
              )}
              {isUploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={themeColors.textPrimary} />
                </View>
              )}
              <View style={[styles.cameraIcon, dynamicStyles.cameraIcon]}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.changePhotoButton} 
            onPress={handlePickImage}
            disabled={isUploadingPhoto}
          >
            <Text style={[styles.changePhotoText, dynamicStyles.changePhotoText]}>
              {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
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
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Profile Information</Text>
          
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
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Change Password</Text>

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
    padding: 4,
  },
  headerTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
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
  avatarContainer: {
    position: 'relative',
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
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  cameraIconText: {
    fontSize: 14,
  },
  changePhotoButton: {
    marginTop: 12,
  },
  changePhotoText: {
    ...typography.body,
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
    marginBottom: 16,
  },
  spacer: {
    height: 12,
  },
  buttonRow: {
    marginTop: 20,
  },
});
