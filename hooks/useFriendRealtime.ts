import { useEffect, useRef, useCallback } from 'react';
import { 
  friendRealtimeService, 
  FriendGameUpdate, 
  FriendActivityUpdate 
} from '@/lib/friendRealtimeService';

/**
 * Hook to subscribe to real-time updates for a specific friend game
 * Use this when on the game play or waiting screen
 */
export function useFriendGameUpdates(
  friendshipId: string | null,
  gameDate: string,
  onUpdate: (update: FriendGameUpdate) => void
) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!friendshipId) return;

    const unsubscribe = friendRealtimeService.subscribeToGame(
      friendshipId,
      gameDate,
      (update) => {
        callbackRef.current(update);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [friendshipId, gameDate]);
}

/**
 * Hook to subscribe to all friend game updates for the current user
 * Use this on the friends list screen to show pending game indicators
 */
export function useAllFriendGameUpdates(
  userId: string | null,
  onUpdate: (update: FriendGameUpdate) => void
) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = friendRealtimeService.subscribeToAllFriendGames(
      userId,
      (update) => {
        callbackRef.current(update);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);
}

/**
 * Hook to subscribe to friend online/activity status
 * Use this on the friends list to show who's online
 */
export function useFriendActivity(
  friendIds: string[],
  onUpdate: (update: FriendActivityUpdate) => void
) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (friendIds.length === 0) return;

    const unsubscribe = friendRealtimeService.subscribeToFriendActivity(
      friendIds,
      (update) => {
        callbackRef.current(update);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [JSON.stringify(friendIds)]);
}

/**
 * Hook to track the current user's presence
 * Use this in the main app or friends tab
 */
export function useTrackPresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    let cleanup: (() => void) | undefined;

    friendRealtimeService.trackPresence(userId).then((untrack) => {
      cleanup = untrack;
    });

    return () => {
      cleanup?.();
    };
  }, [userId]);
}

/**
 * Hook to clean up all realtime subscriptions
 * Use this on logout
 */
export function useRealtimeCleanup() {
  return useCallback(() => {
    friendRealtimeService.cleanup();
  }, []);
}
