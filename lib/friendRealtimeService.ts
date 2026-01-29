import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface FriendGameUpdate {
  gameId: string;
  friendshipId: string;
  status: string;
  initiatorAnswer: number | null;
  friendAnswer: number | null;
  isMatch: boolean | null;
  completedAt: string | null;
}

export interface FriendActivityUpdate {
  friendshipId: string;
  friendId: string;
  isOnline: boolean;
  lastActive: string;
}

type GameUpdateCallback = (update: FriendGameUpdate) => void;
type ActivityCallback = (update: FriendActivityUpdate) => void;

class FriendRealtimeService {
  private gameChannels: Map<string, RealtimeChannel> = new Map();
  private activityChannel: RealtimeChannel | null = null;
  private gameCallbacks: Map<string, Set<GameUpdateCallback>> = new Map();
  private activityCallbacks: Set<ActivityCallback> = new Set();

  /**
   * Subscribe to real-time updates for a specific friend game
   * Called when viewing game play or results screen
   */
  subscribeToGame(
    friendshipId: string,
    gameDate: string,
    callback: GameUpdateCallback
  ): () => void {
    const channelKey = `friend_game_${friendshipId}_${gameDate}`;
    
    // Add callback to set
    if (!this.gameCallbacks.has(channelKey)) {
      this.gameCallbacks.set(channelKey, new Set());
    }
    this.gameCallbacks.get(channelKey)!.add(callback);

    // Create channel if it doesn't exist
    if (!this.gameChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'betterhalf_friend_games',
            filter: `friendship_id=eq.${friendshipId}`,
          },
          (payload) => {
            const update: FriendGameUpdate = {
              gameId: payload.new?.id || payload.old?.id,
              friendshipId: payload.new?.friendship_id || friendshipId,
              status: payload.new?.status,
              initiatorAnswer: payload.new?.initiator_answer,
              friendAnswer: payload.new?.friend_answer,
              isMatch: payload.new?.is_match,
              completedAt: payload.new?.completed_at,
            };

            // Only notify for games from the specified date
            if (payload.new?.game_date === gameDate) {
              const callbacks = this.gameCallbacks.get(channelKey);
              callbacks?.forEach((cb) => cb(update));
            }
          }
        )
        .subscribe();

      this.gameChannels.set(channelKey, channel);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.gameCallbacks.get(channelKey);
      callbacks?.delete(callback);

      // If no more callbacks, remove channel
      if (callbacks?.size === 0) {
        const channel = this.gameChannels.get(channelKey);
        if (channel) {
          supabase.removeChannel(channel);
          this.gameChannels.delete(channelKey);
          this.gameCallbacks.delete(channelKey);
        }
      }
    };
  }

  /**
   * Subscribe to all friend games for a user
   * Used on the friends list screen to show pending game indicators
   */
  subscribeToAllFriendGames(
    userId: string,
    callback: GameUpdateCallback
  ): () => void {
    const channelKey = `all_friend_games_${userId}`;

    if (!this.gameCallbacks.has(channelKey)) {
      this.gameCallbacks.set(channelKey, new Set());
    }
    this.gameCallbacks.get(channelKey)!.add(callback);

    if (!this.gameChannels.has(channelKey)) {
      // We need to listen to all games where this user is involved
      // This requires a custom filter or listening to all and filtering client-side
      const channel = supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'betterhalf_friend_games',
          },
          async (payload) => {
            // Verify this game belongs to a friendship involving the user
            const friendshipId = payload.new?.friendship_id || payload.old?.friendship_id;
            
            const { data: friendship } = await supabase
              .from('betterhalf_friends')
              .select('id, user_id, friend_id')
              .eq('id', friendshipId)
              .single();

            if (friendship && (friendship.user_id === userId || friendship.friend_id === userId)) {
              const update: FriendGameUpdate = {
                gameId: payload.new?.id || payload.old?.id,
                friendshipId,
                status: payload.new?.status,
                initiatorAnswer: payload.new?.initiator_answer,
                friendAnswer: payload.new?.friend_answer,
                isMatch: payload.new?.is_match,
                completedAt: payload.new?.completed_at,
              };

              const callbacks = this.gameCallbacks.get(channelKey);
              callbacks?.forEach((cb) => cb(update));
            }
          }
        )
        .subscribe();

      this.gameChannels.set(channelKey, channel);
    }

    return () => {
      const callbacks = this.gameCallbacks.get(channelKey);
      callbacks?.delete(callback);

      if (callbacks?.size === 0) {
        const channel = this.gameChannels.get(channelKey);
        if (channel) {
          supabase.removeChannel(channel);
          this.gameChannels.delete(channelKey);
          this.gameCallbacks.delete(channelKey);
        }
      }
    };
  }

  /**
   * Subscribe to friend online/activity status
   * Shows when friends are active in the app
   */
  subscribeToFriendActivity(
    friendIds: string[],
    callback: ActivityCallback
  ): () => void {
    this.activityCallbacks.add(callback);

    if (!this.activityChannel) {
      this.activityChannel = supabase
        .channel('friend_activity')
        .on('presence', { event: 'sync' }, () => {
          const state = this.activityChannel?.presenceState() || {};
          
          // Process presence state for each friend
          friendIds.forEach((friendId) => {
            const friendState = state[friendId];
            const update: FriendActivityUpdate = {
              friendshipId: '', // Will be filled by the subscriber
              friendId,
              isOnline: !!friendState && friendState.length > 0,
              lastActive: friendState?.[0]?.last_active || new Date().toISOString(),
            };
            
            this.activityCallbacks.forEach((cb) => cb(update));
          });
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (friendIds.includes(key)) {
            const update: FriendActivityUpdate = {
              friendshipId: '',
              friendId: key,
              isOnline: true,
              lastActive: newPresences[0]?.last_active || new Date().toISOString(),
            };
            this.activityCallbacks.forEach((cb) => cb(update));
          }
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          if (friendIds.includes(key)) {
            const update: FriendActivityUpdate = {
              friendshipId: '',
              friendId: key,
              isOnline: false,
              lastActive: leftPresences[0]?.last_active || new Date().toISOString(),
            };
            this.activityCallbacks.forEach((cb) => cb(update));
          }
        })
        .subscribe();
    }

    return () => {
      this.activityCallbacks.delete(callback);

      if (this.activityCallbacks.size === 0 && this.activityChannel) {
        supabase.removeChannel(this.activityChannel);
        this.activityChannel = null;
      }
    };
  }

  /**
   * Track current user's presence
   * Call this when user opens the app or navigates to friends
   */
  async trackPresence(userId: string): Promise<() => void> {
    const channel = supabase.channel('friend_activity');
    
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          last_active: new Date().toISOString(),
        });
      }
    });

    // Return cleanup function
    return () => {
      channel.untrack();
    };
  }

  /**
   * Clean up all subscriptions
   * Call this on logout or app close
   */
  cleanup(): void {
    // Remove all game channels
    this.gameChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.gameChannels.clear();
    this.gameCallbacks.clear();

    // Remove activity channel
    if (this.activityChannel) {
      supabase.removeChannel(this.activityChannel);
      this.activityChannel = null;
    }
    this.activityCallbacks.clear();
  }
}

// Export singleton instance
export const friendRealtimeService = new FriendRealtimeService();

// React hook for subscribing to friend game updates
export function useFriendGameRealtime(
  friendshipId: string | null,
  gameDate: string,
  onUpdate: GameUpdateCallback
): void {
  if (!friendshipId) return;

  // Note: This should be used inside a useEffect in the component
  // Example usage:
  // useEffect(() => {
  //   return friendRealtimeService.subscribeToGame(friendshipId, gameDate, (update) => {
  //     if (update.status === 'completed') {
  //       // Refresh data or navigate to results
  //     }
  //   });
  // }, [friendshipId, gameDate]);
}
