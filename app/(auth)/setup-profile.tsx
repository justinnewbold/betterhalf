import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { getSupabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { typography, fontFamilies } from '../../constants/typography';

/**
 * Profile Setup Screen - First step after signup/signin
 * User sets their name and photo before inviting their partner
 */
export default function SetupProfile() {
  const { user, updateProfile, signOut } = useAuthStore();
  
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  
  // Web file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContinue = async () => {
    setError(null);

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      // Update display name if changed
      if (displayName !== user?.display_name) {
        const { error: profileError } = await updateProfile({ 
          display_name: displayName.trim(),
          profile_completed: true 
        });
        if (profileError) throw profileError;
      } else {
        // Just mark profile as completed
        const { error: profileError } = await updateProfile({ profile_completed: true });
        if (profileError) throw profileError;
      }

      // Navigate to invite screen
      router.replace('/(auth)/invite');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    setError(null);
    
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access photos is required');
      return;
    }

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

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

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

      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('betterhalf-avatars')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('betterhalf-avatars')
        .getPublicUrl(filePath);

      const { error: profileError } = await updateProfile({ avatar_url: publicUrl });
      if (profileError) throw profileError;

      setLocalAvatarUri(uri);
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

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('betterhalf-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('betterhalf-avatars')
        .getPublicUrl(filePath);

      const { error: profileError } = await updateProfile({ avatar_url: publicUrl });
      if (profileError) throw profileError;

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload photo');
      setLocalAvatarUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  const userInitial = displayName?.charAt(0).toUpperCase() || user?.display_name?.charAt(0).toUpperCase() || '?';
  const displayAvatarUri = localAvatarUri || user?.avatar_url;

  return (
    <SafeAreaView style={styles.container}>
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircles}>
            <LinearGradient colors={[colors.coral, colors.coralLight]} style={[styles.circle, styles.circleLeft]} />
            <LinearGradient colors={[colors.purple, colors.purpleLight]} style={[styles.circle, styles.circleRight]} />
          </View>
        </View>

        <Text style={styles.title}>Set Up Your Profile</Text>
        <Text style={styles.subtitle}>
          Help your partner recognize you when they receive your invite
        </Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploadingPhoto}>
            <View style={styles.avatarContainer}>
              {displayAvatarUri ? (
                <Image source={{ uri: displayAvatarUri }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={[colors.coral, colors.coralLight]} style={styles.avatar}>
                  <Text style={styles.avatarText}>{userInitial}</Text>
                </LinearGradient>
              )}
              {isUploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={colors.textPrimary} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.changePhotoButton} 
            onPress={handlePickImage}
            disabled={isUploadingPhoto}
          >
            <Text style={styles.changePhotoText}>
              {isUploadingPhoto ? 'Uploading...' : (displayAvatarUri ? 'Change Photo' : 'Add Photo')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Name Input */}
        <Card style={styles.card}>
          <Input
            label="Your Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            autoCapitalize="words"
            autoFocus
          />
          <Text style={styles.hint}>
            This is how your partner will see you in the app
          </Text>
        </Card>

        <View style={styles.spacer} />

        <Button
          title={isLoading ? "Saving..." : "Continue"}
          onPress={handleContinue}
          disabled={isLoading || isUploadingPhoto || !displayName.trim()}
          loading={isLoading}
          fullWidth
        />

        <View style={{ height: 16 }} />

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="ghost"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
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
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 48,
    color: colors.textPrimary,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.darkBg,
  },
  cameraIconText: {
    fontSize: 16,
  },
  changePhotoButton: {
    marginTop: 12,
  },
  changePhotoText: {
    ...typography.body,
    color: colors.purpleLight,
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
  card: {
    marginBottom: 8,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 8,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
