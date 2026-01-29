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
import { colors } from '../../../constants/colors';
import { useFriendsStore } from '../../../stores/friendsStore';
import { useAuthStore } from '../../../stores/authStore';
import { RELATIONSHIP_TYPES, RelationshipType } from '../../../lib/supabase';
import AddFriendModal from '../../../components/AddFriendModal';

export default function FriendsScreen() {
  const { user } = useAuthStore();
  const { 
    friends, 
    pendingRequests, 
    pendingInvites,
    isLoading, 
    fetchFriends,
    acceptFriendInvite,
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
    if (!user?.id) return;
    setRefreshing(true);
    await fetchFriends(user.id);
    setRefreshing(false);
  };

  const handleAcceptInvite = async (friendshipId: string) => {
    if (!user?.id) return;
    const friend = pendingRequests.find(r => r.id === friendshipId);
    const { error } = await acceptFriendInvite(user.id, friend?.invite_code || '');
    if (error) {
      Alert.alert('Error', 'Could not accept invite. Please try again.');
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

  const renderFriendCard = (friend: typeof friends[0]) => {
    const displayName = friend.nickname || friend.friend_user?.display_name || 'Friend';
    const pendingGames = friend.pending_response_count || 0;

    return (
      <TouchableOpacity
        key={friend.id}
        style={styles.friendCard}
        onPress={() => router.push(`/friends/play/${friend.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.friendAvatar}>
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
          <Text style={styles.friendName}>{displayName}</Text>
          <Text style={styles.friendType}>
            {RELATIONSHIP_TYPES.find(r => r.id === friend.relationship_type)?.label || 'Friend'}
          </Text>
        </View>

        <View style={styles.friendActions}>
          {pendingGames > 0 ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingGames}</Text>
            </View>
          ) : (
            <Text style={styles.playButton}>Play →</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPendingRequest = (request: typeof pendingRequests[0]) => {
    const senderName = request.friend_user?.display_name || 'Someone';

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestEmoji}>
            {getRelationshipIcon(request.relationship_type)}
          </Text>
          <View>
            <Text style={styles.requestText}>
              <Text style={styles.requestName}>{senderName}</Text> wants to connect
            </Text>
            <Text style={styles.requestType}>
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
            style={styles.declineButton}
            onPress={() => handleDeclineInvite(request.id)}
          >
            <Text style={styles.declineButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends & Family</Text>
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
            tintColor={colors.coral}
          />
        }
      >
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Requests ({pendingRequests.length})
            </Text>
            {pendingRequests.map(renderPendingRequest)}
          </View>
        )}

        {/* Active Friends */}
        {friends.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Connections</Text>
            {friends.map(renderFriendCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyText}>
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
            <Text style={styles.sectionTitle}>
              Pending Invites ({pendingInvites.length})
            </Text>
            {pendingInvites.map(invite => (
              <View key={invite.id} style={styles.pendingInviteCard}>
                <Text style={styles.pendingInviteText}>
                  {getRelationshipIcon(invite.relationship_type)} Invite sent
                </Text>
                <Text style={styles.pendingInviteCode}>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
  friendName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  friendType: {
    fontSize: 13,
    color: colors.textMuted,
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
  playButton: {
    color: colors.coral,
    fontSize: 14,
    fontWeight: '600',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
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
  requestText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  requestName: {
    fontWeight: '600',
  },
  requestType: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
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
  declineButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  declineButtonText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  pendingInviteCard: {
    backgroundColor: colors.cardDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingInviteText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  pendingInviteCode: {
    fontSize: 13,
    color: colors.coral,
    fontFamily: 'monospace',
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
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
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
