import { create } from 'zustand';
import { getSupabase, TABLES, generateInviteCode, QuestionCategory, RelationshipType, FriendStatus } from '../lib/supabase';
import type { Tables, FriendWithUser, FriendGameWithQuestion } from '../lib/supabase';
import { DEFAULT_FRIEND_DAILY_LIMIT, DEFAULT_FRIEND_CATEGORIES, INVITE_CODE_EXPIRY_DAYS } from '../constants/config';

type Friend = Tables['friends'];
type FriendGame = Tables['friend_games'];

interface FriendsState {
  // Data
  friends: FriendWithUser[];
  pendingInvites: FriendWithUser[]; // Invites you sent (pending)
  pendingRequests: FriendWithUser[]; // Invites sent to you (pending)
  activeFriendGames: Map<string, FriendGameWithQuestion[]>; // friendshipId -> today's games
  
  // UI State
  isLoading: boolean;
  hasFetched: boolean;
  
  // Actions
  fetchFriends: (userId: string) => Promise<void>;
  createFriendInvite: (userId: string, relationshipType: RelationshipType, nickname?: string) => Promise<{ inviteCode: string | null; error: unknown }>;
  acceptFriendInvite: (userId: string, inviteCode: string) => Promise<{ error: unknown }>;
  acceptFriendRequest: (userId: string, friendshipId: string) => Promise<{ error: unknown }>; // NEW: Accept by friendship ID
  declineFriendInvite: (friendshipId: string) => Promise<{ error: unknown }>;
  removeFriend: (friendshipId: string) => Promise<{ error: unknown }>;
  blockFriend: (friendshipId: string) => Promise<{ error: unknown }>;
  updateFriendSettings: (friendshipId: string, updates: Partial<Friend>) => Promise<{ error: unknown }>;
  
  // Game Actions
  fetchTodaysGames: (friendshipId: string) => Promise<FriendGameWithQuestion[]>;
  submitAnswer: (gameId: string, answer: number, isInitiator: boolean) => Promise<{ error: unknown }>;
  
  // Utilities
  getFriendById: (friendshipId: string) => FriendWithUser | undefined;
  getPendingGamesCount: () => number;
  reset: () => void;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  pendingInvites: [],
  pendingRequests: [],
  activeFriendGames: new Map(),
  isLoading: false,
  hasFetched: false,

  fetchFriends: async (userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) {
      console.log('[FriendsStore] No supabase or userId');
      set({ isLoading: false, hasFetched: true });
      return;
    }

    set({ isLoading: true });
    console.log('[FriendsStore] Fetching friends for user:', userId);

    try {
      // Fetch all friendships where user is involved
      // This includes: accepted friendships AND pending invites where user_id matches
      const { data: friendships, error } = await supabase
        .from(TABLES.friends)
        .select(`
          *,
          friend_user:betterhalf_users!betterhalf_friends_friend_id_fkey(id, display_name, avatar_url, email),
          initiator_user:betterhalf_users!betterhalf_friends_user_id_fkey(id, display_name, avatar_url, email)
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .neq('status', 'blocked');

      if (error) {
        console.error('[FriendsStore] Fetch error:', error);
        set({ isLoading: false, hasFetched: true });
        return;
      }

      console.log('[FriendsStore] Found friendships:', friendships?.length);

      // Categorize friendships
      const accepted: FriendWithUser[] = [];
      const pendingInvites: FriendWithUser[] = [];
      const pendingRequests: FriendWithUser[] = [];

      for (const f of friendships || []) {
        // Determine which user is the "friend" from current user's perspective
        const isInitiator = f.user_id === userId;
        const friendUser = isInitiator ? f.friend_user : f.initiator_user;

        const friendWithUser: FriendWithUser = {
          id: f.id,
          user_id: f.user_id,
          friend_id: f.friend_id,
          nickname: f.nickname,
          relationship_type: f.relationship_type as RelationshipType,
          status: f.status as FriendStatus,
          invite_code: f.invite_code,
          preferred_categories: f.preferred_categories || [...DEFAULT_FRIEND_CATEGORIES],
          daily_limit: f.daily_limit || DEFAULT_FRIEND_DAILY_LIMIT,
          created_at: f.created_at,
          accepted_at: f.accepted_at,
          friend_user: friendUser ? {
            id: friendUser.id,
            display_name: friendUser.display_name,
            avatar_url: friendUser.avatar_url,
            email: friendUser.email,
          } : undefined,
        };

        if (f.status === 'accepted') {
          accepted.push(friendWithUser);
        } else if (f.status === 'pending') {
          if (isInitiator) {
            // User created this invite - it's a pending invite they sent
            pendingInvites.push(friendWithUser);
          }
          // Note: pendingRequests are now fetched separately to avoid RLS issues
        }
      }

      // Fetch pending game counts for accepted friends
      for (const friend of accepted) {
        const { count } = await supabase
          .from(TABLES.friend_games)
          .select('*', { count: 'exact', head: true })
          .eq('friendship_id', friend.id)
          .eq('game_date', new Date().toISOString().split('T')[0])
          .in('status', ['waiting_initiator', 'waiting_friend', 'waiting_both']);
        
        friend.pending_response_count = count || 0;
      }

      set({
        friends: accepted,
        pendingInvites,
        pendingRequests, // Will be empty for now - users accept via deep link
        isLoading: false,
        hasFetched: true,
      });

      console.log('[FriendsStore] Loaded:', accepted.length, 'friends,', pendingInvites.length, 'pending invites sent');
    } catch (err) {
      console.error('[FriendsStore] Unexpected error:', err);
      set({ isLoading: false, hasFetched: true });
    }
  },

  createFriendInvite: async (userId, relationshipType, nickname) => {
    const supabase = getSupabase();
    if (!supabase) return { inviteCode: null, error: 'No database connection' };

    try {
      const inviteCode = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITE_CODE_EXPIRY_DAYS);

      const { data, error } = await supabase
        .from(TABLES.friends)
        .insert({
          user_id: userId,
          relationship_type: relationshipType,
          nickname: nickname || null,
          status: 'pending',
          invite_code: inviteCode,
          invite_expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[FriendsStore] Create invite error:', error);
        return { inviteCode: null, error };
      }

      console.log('[FriendsStore] Created invite:', inviteCode);
      
      // Refresh friends list
      get().fetchFriends(userId);
      
      return { inviteCode, error: null };
    } catch (err) {
      console.error('[FriendsStore] Create invite unexpected error:', err);
      return { inviteCode: null, error: err };
    }
  },

  acceptFriendInvite: async (userId, inviteCode) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'No database connection' };

    try {
      // Find the pending invite by code
      const { data: invite, error: findError } = await supabase
        .from(TABLES.friends)
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .maybeSingle();

      if (findError || !invite) {
        console.error('[FriendsStore] Invite not found:', findError);
        return { error: 'Invalid or expired invite code' };
      }

      // Check if invite expired
      if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) {
        return { error: 'This invite has expired' };
      }

      // Check if user is trying to accept their own invite
      if (invite.user_id === userId) {
        return { error: 'You cannot accept your own invite' };
      }

      // Check if already friends
      const { data: existing } = await supabase
        .from(TABLES.friends)
        .select('id')
        .or(`and(user_id.eq.${userId},friend_id.eq.${invite.user_id}),and(user_id.eq.${invite.user_id},friend_id.eq.${userId})`)
        .eq('status', 'accepted')
        .maybeSingle();

      if (existing) {
        return { error: 'You are already friends with this person' };
      }

      // Accept the invite
      const { error: updateError } = await supabase
        .from(TABLES.friends)
        .update({
          friend_id: userId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          invite_code: null, // Clear the code after use
          invite_expires_at: null,
        })
        .eq('id', invite.id);

      if (updateError) {
        console.error('[FriendsStore] Accept invite error:', updateError);
        return { error: updateError };
      }

      console.log('[FriendsStore] Accepted invite from:', invite.user_id);
      
      // Refresh friends list
      get().fetchFriends(userId);
      
      return { error: null };
    } catch (err) {
      console.error('[FriendsStore] Accept invite unexpected error:', err);
      return { error: err };
    }
  },

  // NEW: Accept friend request by friendship ID (for UI accept button)
  acceptFriendRequest: async (userId, friendshipId) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'No database connection' };

    try {
      // Get the friendship to verify it's valid
      const { data: friendship, error: findError } = await supabase
        .from(TABLES.friends)
        .select('*')
        .eq('id', friendshipId)
        .eq('status', 'pending')
        .single();

      if (findError || !friendship) {
        console.error('[FriendsStore] Friendship not found:', findError);
        return { error: 'Friend request not found' };
      }

      // Verify user isn't the initiator (can't accept own invite)
      if (friendship.user_id === userId) {
        return { error: 'You cannot accept your own invite' };
      }

      // Check if invite expired
      if (friendship.invite_expires_at && new Date(friendship.invite_expires_at) < new Date()) {
        return { error: 'This invite has expired' };
      }

      // Accept the friend request
      const { error: updateError } = await supabase
        .from(TABLES.friends)
        .update({
          friend_id: userId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          invite_code: null,
          invite_expires_at: null,
        })
        .eq('id', friendshipId);

      if (updateError) {
        console.error('[FriendsStore] Accept request error:', updateError);
        return { error: updateError };
      }

      console.log('[FriendsStore] Accepted friend request:', friendshipId);
      
      // Refresh friends list
      get().fetchFriends(userId);
      
      return { error: null };
    } catch (err) {
      console.error('[FriendsStore] Accept request unexpected error:', err);
      return { error: err };
    }
  },

  declineFriendInvite: async (friendshipId) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'No database connection' };

    const { error } = await supabase
      .from(TABLES.friends)
      .update({ status: 'declined' })
      .eq('id', friendshipId);

    if (error) {
      console.error('[FriendsStore] Decline invite error:', error);
      return { error };
    }

    // Update local state
    set(state => ({
      pendingRequests: state.pendingRequests.filter(r => r.id !== friendshipId),
    }));

    return { error: null };
  },

  removeFriend: async (friendshipId) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'No database connection' };

    const { error } = await supabase
      .from(TABLES.friends)
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('[FriendsStore] Remove friend error:', error);
      return { error };
    }

    // Update local state
    set(state => ({
      friends: state.friends.filter(f => f.id !== friendshipId),
      pendingInvites: state.pendingInvites.filter(f => f.id !== friendshipId),
    }));

    return { error: null };
  },

  blockFriend: async (friendshipId) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'No database connection' };

    const { error } = await supabase
      .from(TABLES.friends)
      .update({ status: 'blocked' })
      .eq('id', friendshipId);

    if (error) {
      console.error('[FriendsStore] Block friend error:', error);
      return { error };
    }

    // Update local state
    set(state => ({
      friends: state.friends.filter(f => f.id !== friendshipId),
      pendingRequests: state.pendingRequests.filter(r => r.id !== friendshipId),
    }));

    return { error: null };
  },

  updateFriendSettings: async (friendshipId, updates) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'No database connection' };

    const { error } = await supabase
      .from(TABLES.friends)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', friendshipId);

    if (error) {
      console.error('[FriendsStore] Update settings error:', error);
      return { error };
    }

    // Update local state
    set(state => ({
      friends: state.friends.map(f =>
        f.id === friendshipId ? { ...f, ...updates } : f
      ),
    }));

    return { error: null };
  },

  fetchTodaysGames: async (friendshipId) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from(TABLES.friend_games)
      .select(`
        *,
        question:betterhalf_questions(id, category, question, options)
      `)
      .eq('friendship_id', friendshipId)
      .eq('game_date', today)
      .order('question_number', { ascending: true });

    if (error) {
      console.error('[FriendsStore] Fetch games error:', error);
      return [];
    }

    const games: FriendGameWithQuestion[] = (data || []).map(g => ({
      ...g,
      question: g.question ? {
        id: g.question.id,
        category: g.question.category,
        question: g.question.question,
        options: g.question.options,
      } : undefined,
    }));

    // Update local cache
    set(state => {
      const newMap = new Map(state.activeFriendGames);
      newMap.set(friendshipId, games);
      return { activeFriendGames: newMap };
    });

    return games;
  },

  submitAnswer: async (gameId, answer, isInitiator) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'No database connection' };

    // Get current game state
    const { data: game, error: fetchError } = await supabase
      .from(TABLES.friend_games)
      .select('*')
      .eq('id', gameId)
      .single();

    if (fetchError || !game) {
      return { error: fetchError || 'Game not found' };
    }

    const updates: Record<string, unknown> = {
      [isInitiator ? 'initiator_answer' : 'friend_answer']: answer,
      [isInitiator ? 'initiator_answered_at' : 'friend_answered_at']: new Date().toISOString(),
    };

    // Determine new status
    const otherAnswered = isInitiator ? game.friend_answer !== null : game.initiator_answer !== null;
    
    if (otherAnswered) {
      // Both have now answered
      const otherAnswer = isInitiator ? game.friend_answer : game.initiator_answer;
      updates.status = 'completed';
      updates.is_match = answer === otherAnswer;
      updates.completed_at = new Date().toISOString();
    } else {
      // Waiting for other person
      updates.status = isInitiator ? 'waiting_friend' : 'waiting_initiator';
    }

    const { error } = await supabase
      .from(TABLES.friend_games)
      .update(updates)
      .eq('id', gameId);

    if (error) {
      console.error('[FriendsStore] Submit answer error:', error);
      return { error };
    }

    return { error: null };
  },

  getFriendById: (friendshipId) => {
    return get().friends.find(f => f.id === friendshipId);
  },

  getPendingGamesCount: () => {
    return get().friends.reduce((sum, f) => sum + (f.pending_response_count || 0), 0);
  },

  reset: () => {
    set({
      friends: [],
      pendingInvites: [],
      pendingRequests: [],
      activeFriendGames: new Map(),
      isLoading: false,
      hasFetched: false,
    });
  },
}));
