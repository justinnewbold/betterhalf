import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, getThemeColors } from '../../../constants/colors';
import { useThemeStore } from '../../../stores/themeStore';
import { useFriendsStore } from '../../../stores/friendsStore';
import { useAuthStore } from '../../../stores/authStore';
import { RELATIONSHIP_TYPES, RelationshipType } from '../../../lib/supabase';
import AddFriendModal from '../../../components/AddFriendModal';
import { hapticLight, hapticSuccess, hapticError } from '../../../lib/haptics';

export default function FriendsScreen() {
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const themeColors = getThemeColors(isDark);
  const { 
    friends, 
    pendingRequests, 
    pendingInvites,
    isLoading, 
    fetchFriends,
    acceptFriendRequest, // Use new method for accepting by ID
    declineFriendInvite,
  } = useFriendsStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchFriends(user.id);
    }
  }, [user?.id]);

  const onRefresh = async () => {
    hapticLight();
    if (!user?.id) return;
    setRefreshing(true);
    await fetchFriends(user.id);
    setRefreshing(false);
  };

  // Fixed: Use acceptFriendRequest with friendship ID instead of invite code
  const handleAcceptInvite = async (friendshipId: string) => {
    if (!user?.id) return;
    const { error } = await acceptFriendRequest(user.id, friendshipId);
    if (error) {
      const errorMsg = typeof error === 'string' ? error : 'Could not accept invite. Please try again.';
      hapticError();
      Alert.alert('Error', errorMsg);
    } else {
      hapticSuccess();
      Alert.alert('Success!', 'You are now connected!');
    }
  };

  const handleDeclineInvite = async (friendshipId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            const { error } = await declineFriendInvite(friendshipId);
            if (error) {
              Alert.alert('Error', 'Could not decline invite. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getRelationshipIcon = (type: RelationshipType) => {
    return RELATIONSHIP_TYPES.find(r => r.id === type)?.icon || '👤';
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      color: themeColors.textPrimary,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: themeColors.textMuted,
      marginBottom: 12,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    friendCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: themeColors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.cardBorder,
    },
    friendAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: themeColors.inputBackground,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      overflow: 'hidden' as const,
    },
    friendName: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: themeColors.textPrimary,
      marginBottom: 2,
    },
    friendType: {
      fontSize: 13,
      color: themeColors.textMuted,
    },
    playButton: {
      color: themeColors.coral,
      fontSize: 14,
      fontWeight: '600' as const,
    },
    requestCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      backgroundColor: isDark ? 'rgba(255, 107, 107, 0.1)' : 'rgba(232, 85, 85, 0.08)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 107, 107, 0.3)' : 'rgba(232, 85, 85, 0.2)',
    },
    requestText: {
      fontSize: 15,
      color: themeColors.textPrimary,
    },
    requestType: {
      fontSize: 13,
      color: themeColors.textMuted,
      marginTop: 2,
    },
    declineButton: {
      backgroundColor: themeColors.inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    declineButtonText: {
      color: themeColors.textMuted,
      fontSize: 14,
    },
    pendingInviteCard: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: themeColors.cardBorder,
    },
    pendingInviteText: {
      fontSize: 14,
      color: themeColors.textMuted,
    },
    pendingInviteCode: {
      fontSize: 13,
      color: themeColors.coral,
      fontFamily: 'monospace',
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: 'bold' as const,
      color: themeColors.textPrimary,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 15,
      color: themeColors.textMuted,
      textAlign: 'center' as const,
      paddingHorizontal: 40,
      marginBottom: 24,
    },
  };

  const renderFriendCard = (friend: typeof friends[0]) => {
    const displayName = friend.nickname || friend.friend_user?.display_name || 'Friend';
    const pendingGames = friend.pending_response_count || 0;

    return (
      <TouchableOpacity
        key={friend.id}
        style={dynamicStyles.friendCard}
        onPress={() => router.push(`/(main)/friends/play/${friend.id}`)}
        activeOpacity={0.7}
      >
        <View style={dynamicStyles.friendAvatar}>
          {friend.friend_user?.avatar_url ? (
            <Image
              source={{ uri: friend.friend_user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarEmoji}>
              {getRelationshipIcon(friend.relationship_type)}
            </Text>
          )}
        </View>
        
        <View style={styles.friendInfo}>
          <Text style={dynamicStyles.friendName}>{displayName}</Text>
          <Text style={dynamicStyles.friendType}>
            {RELATIONSHIP_TYPES.find(r => r.id === friend.relationship_type)?.label || 'Friend'}
          </Text>
        </View>

        <View style={styles.friendActions}>
          {pendingGames > 0 ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingGames}</Text>
            </View>
          ) : (
            <Text style={dynamicStyles.playButton}>Play →</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPendingRequest = (request: typeof pendingRequests[0]) => {
    // For pending requests, the initiator_user is who sent the invite
    const senderName = request.friend_user?.display_name || 'Someone';

    return (
      <View key={request.id} style={dynamicStyles.requestCard}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestEmoji}>
            {getRelationshipIcon(request.relationship_type)}
          </Text>
          <View>
            <Text style={dynamicStyles.requestText}>
              <Text style={styles.requestName}>{senderName}</Text> wants to connect
            </Text>
            <Text style={dynamicStyles.requestType}>
              as {RELATIONSHIP_TYPES.find(r => r.id === request.relationship_type)?.label}
            </Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptInvite(request.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.declineButton}
            onPress={() => handleDeclineInvite(request.id)}
          >
            <Text style={dynamicStyles.declineButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={dynamicStyles.title}>Friends & Family</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.coral}
          />
        }
      >
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>
              Pending Requests ({pendingRequests.length})
            </Text>
            {pendingRequests.map(renderPendingRequest)}
          </View>
        )}

        {/* Active Friends */}
        {friends.length > 0 ? (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Your Connections</Text>
            {friends.map(renderFriendCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={dynamicStyles.emptyTitle}>No friends yet</Text>
            <Text style={dynamicStyles.emptyText}>
              Add friends and family to play daily question games with them!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyButtonText}>Add Your First Friend</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Invites (sent by you) */}
        {pendingInvites.length > 0 && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>
              Pending Invites ({pendingInvites.length})
            </Text>
            {pendingInvites.map(invite => (
              <View key={invite.id} style={dynamicStyles.pendingInviteCard}>
                <Text style={dynamicStyles.pendingInviteText}>
                  {getRelationshipIcon(invite.relationship_type)} Invite sent
                </Text>
                <Text style={dynamicStyles.pendingInviteCode}>
                  Code: {invite.invite_code}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AddFriendModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  addButton: {
    backgroundColor: colors.coral,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 14,
  },
  friendActions: {
    alignItems: 'flex-end',
  },
  pendingBadge: {
    backgroundColor: colors.coral,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  requestName: {
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: colors.coral,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.coral,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

