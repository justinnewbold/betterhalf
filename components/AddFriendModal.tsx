import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
  Platform,
  Clipboard,
  ScrollView,
} from 'react-native';
import { colors } from '../constants/colors';
import { useFriendsStore } from '../stores/friendsStore';
import { useAuthStore } from '../stores/authStore';
import { RELATIONSHIP_TYPES, RelationshipType } from '../lib/supabase';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddFriendModal({ visible, onClose }: AddFriendModalProps) {
  const { user } = useAuthStore();
  const { createFriendInvite, acceptFriendInvite } = useFriendsStore();
  
  const [mode, setMode] = useState<'choose' | 'send' | 'enter'>('choose');
  const [selectedType, setSelectedType] = useState<RelationshipType>('friend');
  const [nickname, setNickname] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setMode('choose');
    setSelectedType('friend');
    setNickname('');
    setInviteCode('');
    setGeneratedCode('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleGenerateInvite = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    const { inviteCode: code, error } = await createFriendInvite(
      user.id,
      selectedType,
      nickname || undefined
    );
    setIsLoading(false);

    if (error || !code) {
      Alert.alert('Error', 'Could not create invite. Please try again.');
      return;
    }

    setGeneratedCode(code);
  };

  const handleShare = async () => {
    const inviteUrl = `https://betterhalf.newbold.cloud/invite/friend/${generatedCode}`;
    const message = `Join me on Better Half! Play fun question games with friends and family. Use code: ${generatedCode}\n\n${inviteUrl}`;

    try {
      await Share.share({
        message,
        title: 'Better Half Invite',
      });
    } catch (error) {
      // User cancelled or error
    }
  };

  const handleCopyCode = () => {
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(generatedCode);
    } else {
      Clipboard.setString(generatedCode);
    }
    Alert.alert('Copied!', 'Invite code copied to clipboard');
  };

  const handleAcceptInvite = async () => {
    if (!user?.id || !inviteCode.trim()) return;
    
    setIsLoading(true);
    const { error } = await acceptFriendInvite(user.id, inviteCode.trim());
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', typeof error === 'string' ? error : 'Invalid or expired invite code');
      return;
    }

    Alert.alert('Success!', 'You are now connected!', [
      { text: 'OK', onPress: handleClose }
    ]);
  };

  const renderChooseMode = () => (
    <View style={styles.modeContainer}>
      <Text style={styles.modeTitle}>Add Friend or Family</Text>
      <Text style={styles.modeSubtitle}>
        Connect with people you want to play question games with
      </Text>

      <TouchableOpacity
        style={styles.modeButton}
        onPress={() => setMode('send')}
      >
        <Text style={styles.modeButtonEmoji}>📤</Text>
        <View style={styles.modeButtonText}>
          <Text style={styles.modeButtonTitle}>Send an Invite</Text>
          <Text style={styles.modeButtonDesc}>
            Generate a code to share with someone
          </Text>
        </View>
        <Text style={styles.modeButtonArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.modeButton}
        onPress={() => setMode('enter')}
      >
        <Text style={styles.modeButtonEmoji}>📥</Text>
        <View style={styles.modeButtonText}>
          <Text style={styles.modeButtonTitle}>Enter a Code</Text>
          <Text style={styles.modeButtonDesc}>
            Accept an invite from someone else
          </Text>
        </View>
        <Text style={styles.modeButtonArrow}>→</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSendInvite = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {!generatedCode ? (
        <>
          <Text style={styles.stepTitle}>Who are you inviting?</Text>
          
          <View style={styles.typeGrid}>
            {RELATIONSHIP_TYPES.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  selectedType === type.id && styles.typeButtonSelected,
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Text style={styles.typeEmoji}>{type.icon}</Text>
                <Text style={[
                  styles.typeLabel,
                  selectedType === type.id && styles.typeLabelSelected,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Nickname (optional)</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g., Mom, Best Friend, etc."
            placeholderTextColor={colors.textMuted}
            maxLength={30}
          />

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleGenerateInvite}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Creating...' : 'Generate Invite'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.successTitle}>Invite Created! 🎉</Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Your invite code:</Text>
            <Text style={styles.codeText}>{generatedCode}</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleShare}
          >
            <Text style={styles.primaryButtonText}>📤 Share Invite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCopyCode}
          >
            <Text style={styles.secondaryButtonText}>📋 Copy Code</Text>
          </TouchableOpacity>

          <Text style={styles.expiryNote}>
            This invite expires in 7 days
          </Text>
        </>
      )}
    </ScrollView>
  );

  const renderEnterCode = () => (
    <View style={styles.enterContainer}>
      <Text style={styles.stepTitle}>Enter Invite Code</Text>
      <Text style={styles.stepSubtitle}>
        Enter the 8-character code someone shared with you
      </Text>

      <TextInput
        style={styles.codeInput}
        value={inviteCode}
        onChangeText={text => setInviteCode(text.toUpperCase())}
        placeholder="ABCD1234"
        placeholderTextColor={colors.textMuted}
        maxLength={8}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!inviteCode.trim() || isLoading) && styles.buttonDisabled,
        ]}
        onPress={handleAcceptInvite}
        disabled={!inviteCode.trim() || isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Connecting...' : 'Accept Invite'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          {mode !== 'choose' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setGeneratedCode('');
                setMode('choose');
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerSpacer} />
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {mode === 'choose' && renderChooseMode()}
          {mode === 'send' && renderSendInvite()}
          {mode === 'enter' && renderEnterCode()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: colors.coral,
    fontSize: 16,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    color: colors.textMuted,
    fontSize: 24,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  modeContainer: {
    flex: 1,
    paddingTop: 20,
  },
  modeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modeSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 32,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  modeButtonEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  modeButtonText: {
    flex: 1,
  },
  modeButtonTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modeButtonDesc: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modeButtonArrow: {
    fontSize: 20,
    color: colors.coral,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 10,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 24,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  typeButton: {
    width: '31%',
    backgroundColor: colors.cardDark,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonSelected: {
    borderColor: colors.coral,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  typeEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: colors.coral,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardDark,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.coral,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    backgroundColor: colors.cardDark,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  codeContainer: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.coral,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  expiryNote: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  enterContainer: {
    paddingTop: 20,
  },
  codeInput: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: 20,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 24,
  },
});
