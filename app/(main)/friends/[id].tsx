import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useFriendsStore } from '../../../stores/friendsStore';
import { useAuthStore } from '../../../stores/authStore';
import { colors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';
import { RELATIONSHIP_TYPES, QUESTION_CATEGORIES, FRIEND_SAFE_CATEGORIES, QuestionCategory, RelationshipType } from '../../../lib/supabase';

export default function FriendSettingsScreen() {
  const { id: friendshipId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { getFriendById, updateFriendSettings, removeFriend, blockFriend, fetchFriends } = useFriendsStore();
  
  const friend = getFriendById(friendshipId || '');
  
  const [nickname, setNickname] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('friend');
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Determine if current user is initiator
  const isInitiator = friend?.user_id === user?.id;
  const friendUser = isInitiator ? friend?.friend_user : friend?.initiator_user;
  const friendName = friend?.nickname || friendUser?.display_name || 'Friend';
  const friendAvatar = friendUser?.avatar_url;
  const friendEmail = friendUser?.email;

  // Initialize form with current values
  useEffect(() => {
    if (friend) {
      setNickname(friend.nickname || '');
      setRelationshipType(friend.relationship_type as RelationshipType);
      setSelectedCategories(friend.preferred_categories || FRIEND_SAFE_CATEGORIES);
      setDailyLimit(friend.daily_limit || 10);
    }
  }, [friend]);

  // Track changes
  useEffect(() => {
    if (!friend) return;
    
    const nicknameChanged = nickname !== (friend.nickname || '');
    const typeChanged = relationshipType !== friend.relationship_type;
    const categoriesChanged = JSON.stringify(selectedCategories.sort()) !== 
                             JSON.stringify((friend.preferred_categories || FRIEND_SAFE_CATEGORIES).sort());
    const limitChanged = dailyLimit !== (friend.daily_limit || 10);
    
    setHasChanges(nicknameChanged || typeChanged || categoriesChanged || limitChanged);
  }, [nickname, relationshipType, selectedCategories, dailyLimit, friend]);

  if (!friend) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.coralPrimary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCategoryToggle = (categoryId: QuestionCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        // Don't allow removing the last category
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleSave = async () => {
    if (!friendshipId) return;
    
    setIsSaving(true);
    
    const updates = {
      nickname: nickname.trim() || null,
      relationship_type: relationshipType,
      preferred_categories: selectedCategories,
      daily_limit: dailyLimit,
    };
    
    const { error } = await updateFriendSettings(friendshipId, updates);
    
    setIsSaving(false);
    
    if (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } else {
      // Refresh friends list
      if (user?.id) {
        await fetchFriends(user.id);
      }
      setHasChanges(false);
      Alert.alert('Success', 'Settings saved!');
    }
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends? This will delete all game history with them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            if (!friendshipId) return;
            const { error } = await removeFriend(friendshipId);
            if (error) {
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
            } else {
              if (user?.id) {
                await fetchFriends(user.id);
              }
              router.back();
            }
          }
        }
      ]
    );
  };

  const handleBlockFriend = () => {
    Alert.alert(
      'Block Friend',
      `Are you sure you want to block ${friendName}? They won't be able to send you new invites.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: async () => {
            if (!friendshipId) return;
            const { error } = await blockFriend(friendshipId);
            if (error) {
              Alert.alert('Error', 'Failed to block friend. Please try again.');
            } else {
              if (user?.id) {
                await fetchFriends(user.id);
              }
              router.back();
            }
          }
        }
      ]
    );
  };

  const handlePlayGame = () => {
    router.push(`/(main)/friends/play/${friendshipId}`);
  };

  // Filter categories to only friend-safe ones
  const availableCategories = QUESTION_CATEGORIES.filter(
    cat => FRIEND_SAFE_CATEGORIES.includes(cat.id)
  );

  const getRelationshipIcon = (type: string) => {
    const found = RELATIONSHIP_TYPES.find(r => r.id === type);
    return found?.icon || '👤';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friend Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {friendAvatar ? (
              <Image source={{ uri: friendAvatar }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[colors.greenAccent, colors.purpleLight]}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarInitial}>
                  {friendName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.relationshipIconBadge}>
              <Text style={styles.relationshipIconText}>
                {getRelationshipIcon(relationshipType)}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>{friendName}</Text>
          {friendEmail && (
            <Text style={styles.profileEmail}>{friendEmail}</Text>
          )}
          <Text style={styles.friendSince}>
            Friends since {new Date(friend.accepted_at || friend.created_at).toLocaleDateString()}
          </Text>
          
          <Button
            title="Play Game"
            onPress={handlePlayGame}
            size="small"
            style={styles.playButton}
          />
        </View>

        {/* Nickname */}
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>NICKNAME</Text>
          <Text style={styles.cardDescription}>
            Give them a custom nickname (only visible to you)
          </Text>
          <TextInput
            style={styles.textInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder={friendUser?.display_name || 'Enter nickname'}
            placeholderTextColor={colors.textMuted}
            maxLength={30}
          />
        </Card>

        {/* Relationship Type */}
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>RELATIONSHIP</Text>
          <Text style={styles.cardDescription}>
            How do you know each other?
          </Text>
          <View style={styles.relationshipGrid}>
            {RELATIONSHIP_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.relationshipOption,
                  relationshipType === type.id && styles.relationshipOptionSelected
                ]}
                onPress={() => setRelationshipType(type.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.relationshipOptionIcon}>{type.icon}</Text>
                <Text style={[
                  styles.relationshipOptionLabel,
                  relationshipType === type.id && styles.relationshipOptionLabelSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Question Categories */}
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>QUESTION CATEGORIES</Text>
          <Text style={styles.cardDescription}>
            Choose which types of questions appear in your games
          </Text>
          <View style={styles.categoriesGrid}>
            {availableCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    isSelected && styles.categoryOptionSelected
                  ]}
                  onPress={() => handleCategoryToggle(category.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelSelected
                  ]}>
                    {category.label}
                  </Text>
                  {isSelected && (
                    <Text style={styles.categoryCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Daily Limit */}
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>DAILY QUESTION LIMIT</Text>
          <Text style={styles.cardDescription}>
            How many questions can you play per day?
          </Text>
          <View style={styles.limitSelector}>
            {[5, 10, 15, 20].map((limit) => (
              <TouchableOpacity
                key={limit}
                style={[
                  styles.limitOption,
                  dailyLimit === limit && styles.limitOptionSelected
                ]}
                onPress={() => setDailyLimit(limit)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.limitText,
                  dailyLimit === limit && styles.limitTextSelected
                ]}>
                  {limit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <Button
            title={isSaving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            fullWidth
            disabled={isSaving}
            style={styles.saveButton}
          />
        )}

        {/* Danger Zone */}
        <Card style={[styles.card, styles.dangerCard]}>
          <Text style={styles.dangerLabel}>DANGER ZONE</Text>
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleRemoveFriend}
            activeOpacity={0.7}
          >
            <Text style={styles.dangerButtonText}>Remove Friend</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dangerButton, styles.blockButton]}
            onPress={handleBlockFriend}
            activeOpacity={0.7}
          >
            <Text style={styles.dangerButtonText}>Block Friend</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    ...typography.body,
    color: colors.greenAccent,
  },
  headerTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 60,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.greenAccent,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 40,
    color: colors.textPrimary,
  },
  relationshipIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.darkBg,
  },
  relationshipIconText: {
    fontSize: 16,
  },
  profileName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  friendSince: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 8,
  },
  playButton: {
    marginTop: 16,
    minWidth: 140,
  },
  card: {
    marginBottom: 16,
  },
  cardLabel: {
    ...typography.captionBold,
    color: colors.textMuted,
    marginBottom: 4,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: colors.darkBg,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    ...typography.body,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  relationshipOptionSelected: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: colors.greenAccent,
  },
  relationshipOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  relationshipOptionLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  relationshipOptionLabelSelected: {
    color: colors.greenAccent,
  },
  categoriesGrid: {
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryOptionSelected: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: colors.greenAccent,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  categoryLabel: {
    flex: 1,
    ...typography.body,
    color: colors.textSecondary,
  },
  categoryLabelSelected: {
    color: colors.textPrimary,
  },
  categoryCheck: {
    ...typography.bodyBold,
    color: colors.greenAccent,
    marginLeft: 8,
  },
  limitSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  limitOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  limitOptionSelected: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: colors.greenAccent,
  },
  limitText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    color: colors.textSecondary,
  },
  limitTextSelected: {
    color: colors.greenAccent,
  },
  saveButton: {
    marginBottom: 16,
  },
  dangerCard: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  dangerLabel: {
    ...typography.captionBold,
    color: colors.coralPrimary,
    marginBottom: 12,
  },
  dangerButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockButton: {
    marginBottom: 0,
  },
  dangerButtonText: {
    ...typography.label,
    color: colors.coralPrimary,
  },
});
