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
import { useThemeStore } from '../../../stores/themeStore';
import { colors, getThemeColors } from '../../../constants/colors';
import { typography, fontFamilies } from '../../../constants/typography';
import { RELATIONSHIP_TYPES, QUESTION_CATEGORIES, FRIEND_SAFE_CATEGORIES, QuestionCategory, RelationshipType } from '../../../lib/supabase';

export default function FriendSettingsScreen() {
  const { id: friendshipId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { getFriendById, updateFriendSettings, removeFriend, blockFriend, fetchFriends } = useFriendsStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  
  const friend = getFriendById(friendshipId || '');
  
  const [nickname, setNickname] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('friend');
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: themeColors.background,
    },
    loadingText: {
      color: themeColors.textMuted,
    },
    header: {
      borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    backText: {
      color: themeColors.greenAccent,
    },
    headerTitle: {
      color: themeColors.textPrimary,
    },
    avatarInitial: {
      color: themeColors.textPrimary,
    },
    relationshipIconBadge: {
      backgroundColor: themeColors.cardBackground,
      borderColor: themeColors.background,
    },
    profileName: {
      color: themeColors.textPrimary,
    },
    profileEmail: {
      color: themeColors.textMuted,
    },
    friendSince: {
      color: themeColors.textMuted,
    },
    cardLabel: {
      color: themeColors.textMuted,
    },
    cardDescription: {
      color: themeColors.textSecondary,
    },
    textInput: {
      backgroundColor: themeColors.background,
      color: themeColors.textPrimary,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    relationshipOption: {
      backgroundColor: themeColors.background,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    relationshipOptionLabel: {
      color: themeColors.textSecondary,
    },
    categoryOption: {
      backgroundColor: themeColors.background,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    categoryLabel: {
      color: themeColors.textSecondary,
    },
    categoryLabelSelected: {
      color: themeColors.textPrimary,
    },
    categoryCheck: {
      color: themeColors.greenAccent,
    },
    limitOption: {
      backgroundColor: themeColors.background,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    limitText: {
      color: themeColors.textSecondary,
    },
    limitTextSelected: {
      color: themeColors.greenAccent,
    },
  };

  // Determine if current user is initiator
  // Note: friend_user in FriendWithUser always represents the "other person" 
  // regardless of who initiated, as it's mapped in friendsStore
  const isInitiator = friend?.user_id === user?.id;
  const friendUser = friend?.friend_user;
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
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.coral} />
          <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading...</Text>
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
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, dynamicStyles.backText]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Friend Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {friendAvatar ? (
              <Image source={{ uri: friendAvatar }} style={[styles.avatar, { borderColor: themeColors.greenAccent }]} />
            ) : (
              <LinearGradient
                colors={[themeColors.greenAccent, themeColors.purpleLight]}
                style={styles.avatarPlaceholder}
              >
                <Text style={[styles.avatarInitial, dynamicStyles.avatarInitial]}>
                  {friendName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={[styles.relationshipIconBadge, dynamicStyles.relationshipIconBadge]}>
              <Text style={styles.relationshipIconText}>
                {getRelationshipIcon(relationshipType)}
              </Text>
            </View>
          </View>
          <Text style={[styles.profileName, dynamicStyles.profileName]}>{friendName}</Text>
          {friendEmail && (
            <Text style={[styles.profileEmail, dynamicStyles.profileEmail]}>{friendEmail}</Text>
          )}
          <Text style={[styles.friendSince, dynamicStyles.friendSince]}>
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
          <Text style={[styles.cardLabel, dynamicStyles.cardLabel]}>NICKNAME</Text>
          <Text style={[styles.cardDescription, dynamicStyles.cardDescription]}>
            Give them a custom nickname (only visible to you)
          </Text>
          <TextInput
            style={[styles.textInput, dynamicStyles.textInput]}
            value={nickname}
            onChangeText={setNickname}
            placeholder={friendUser?.display_name || 'Enter nickname'}
            placeholderTextColor={themeColors.textMuted}
            maxLength={30}
          />
        </Card>

        {/* Relationship Type */}
        <Card style={styles.card}>
          <Text style={[styles.cardLabel, dynamicStyles.cardLabel]}>RELATIONSHIP</Text>
          <Text style={[styles.cardDescription, dynamicStyles.cardDescription]}>
            How do you know each other?
          </Text>
          <View style={styles.relationshipGrid}>
            {RELATIONSHIP_TYPES.map((type) => {
              const isSelected = relationshipType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.relationshipOption,
                    dynamicStyles.relationshipOption,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(74, 222, 128, 0.1)',
                      borderColor: themeColors.greenAccent,
                    }
                  ]}
                  onPress={() => setRelationshipType(type.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.relationshipOptionIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.relationshipOptionLabel,
                    dynamicStyles.relationshipOptionLabel,
                    isSelected && { color: themeColors.greenAccent }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Question Categories */}
        <Card style={styles.card}>
          <Text style={[styles.cardLabel, dynamicStyles.cardLabel]}>QUESTION CATEGORIES</Text>
          <Text style={[styles.cardDescription, dynamicStyles.cardDescription]}>
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
                    dynamicStyles.categoryOption,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(74, 222, 128, 0.1)',
                      borderColor: themeColors.greenAccent,
                    }
                  ]}
                  onPress={() => handleCategoryToggle(category.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    isSelected ? dynamicStyles.categoryLabelSelected : dynamicStyles.categoryLabel
                  ]}>
                    {category.label}
                  </Text>
                  {isSelected && (
                    <Text style={[styles.categoryCheck, dynamicStyles.categoryCheck]}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Daily Limit */}
        <Card style={styles.card}>
          <Text style={[styles.cardLabel, dynamicStyles.cardLabel]}>DAILY QUESTION LIMIT</Text>
          <Text style={[styles.cardDescription, dynamicStyles.cardDescription]}>
            How many questions can you play per day?
          </Text>
          <View style={styles.limitSelector}>
            {[5, 10, 15, 20].map((limit) => {
              const isSelected = dailyLimit === limit;
              return (
                <TouchableOpacity
                  key={limit}
                  style={[
                    styles.limitOption,
                    dynamicStyles.limitOption,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(74, 222, 128, 0.1)',
                      borderColor: themeColors.greenAccent,
                    }
                  ]}
                  onPress={() => setDailyLimit(limit)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.limitText,
                    isSelected ? dynamicStyles.limitTextSelected : dynamicStyles.limitText
                  ]}>
                    {limit}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    ...typography.body,
  },
  headerTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
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
  },
  relationshipIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  relationshipIconText: {
    fontSize: 16,
  },
  profileName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 24,
  },
  profileEmail: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  friendSince: {
    ...typography.caption,
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
    marginBottom: 4,
  },
  cardDescription: {
    ...typography.bodySmall,
    marginBottom: 12,
  },
  textInput: {
    borderRadius: 12,
    padding: 14,
    ...typography.body,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  relationshipOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  relationshipOptionLabel: {
    ...typography.label,
  },
  categoriesGrid: {
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  categoryLabel: {
    flex: 1,
    ...typography.body,
  },
  categoryCheck: {
    ...typography.bodyBold,
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
    borderWidth: 1,
    alignItems: 'center',
  },
  limitText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
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
