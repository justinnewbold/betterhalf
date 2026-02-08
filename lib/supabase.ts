import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INVITE_CODE_LENGTH, INVITE_CODE_CHARS } from '../constants/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Web storage adapter - MUST be synchronous for session restoration to work
const WebStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
};

// Native storage adapter (async is fine for native)
const NativeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
};

// Singleton Supabase client
let _supabase: SupabaseClient | null = null;
let _isCreating = false;

const createSupabaseClient = (): SupabaseClient | null => {
  if (_supabase) return _supabase;
  if (_isCreating) return null;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing configuration');
    return null;
  }
  
  // Skip creation during SSR
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return null;
  }
  
  _isCreating = true;
  
  try {
    console.log('[Supabase] Creating client, platform:', Platform.OS);
    
    // Use synchronous storage for web, async for native
    const storage = Platform.OS === 'web' ? WebStorage : NativeStorage;
    
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // @ts-expect-error: Web storage adapter uses sync methods while Supabase types expect async
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    });
    
    console.log('[Supabase] Client created successfully');
    return _supabase;
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error);
    return null;
  } finally {
    _isCreating = false;
  }
};

// Lazy getter for SSR safety
export const getSupabase = (): SupabaseClient | null => {
  if (!_supabase) {
    _supabase = createSupabaseClient();
  }
  return _supabase;
};

// For direct import (may be null during SSR)
export const supabase = Platform.OS === 'web' && typeof window === 'undefined' 
  ? null 
  : createSupabaseClient();

// Table names
export const TABLES = {
  users: 'betterhalf_users',
  couples: 'betterhalf_couples',
  questions: 'betterhalf_questions',
  custom_questions: 'betterhalf_custom_questions',
  daily_sessions: 'betterhalf_daily_sessions',
  game_sessions: 'betterhalf_game_sessions',
  answers: 'betterhalf_answers',
  streaks: 'betterhalf_streaks',
  achievements: 'betterhalf_achievements',
  user_achievements: 'betterhalf_user_achievements',
  couple_stats: 'betterhalf_couple_stats',
  // Friends & Family Mode tables
  friends: 'betterhalf_friends',
  friend_games: 'betterhalf_friend_games',
} as const;

// Question category types
export type QuestionCategory = 'daily_life' | 'heart' | 'history' | 'spice' | 'fun' | 'deep_talks' | 'custom';

export const QUESTION_CATEGORIES: { id: QuestionCategory; label: string; icon: string; description: string }[] = [
  { id: 'daily_life', label: 'Daily Life', icon: '☀️', description: 'Everyday moments and routines' },
  { id: 'heart', label: 'Romance', icon: '💕', description: 'Love, affection, and intimacy' },
  { id: 'history', label: 'Deep Talks', icon: '💭', description: 'Life stories and meaningful moments' },
  { id: 'spice', label: 'Spicy', icon: '🔥', description: 'Playful and adventurous questions' },
  { id: 'fun', label: 'Fun', icon: '🎉', description: 'Light-hearted and entertaining' },
  { id: 'deep_talks', label: 'Deep Conversations', icon: '💬', description: 'Meaningful questions about life' },
  { id: 'custom', label: 'Custom', icon: '✨', description: 'Questions you created together' },
];

// Friend/Family relationship types
export type RelationshipType = 'friend' | 'family' | 'sibling' | 'parent' | 'child' | 'cousin' | 'other';

export const RELATIONSHIP_TYPES: { id: RelationshipType; label: string; icon: string }[] = [
  { id: 'friend', label: 'Friend', icon: '👫' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'sibling', label: 'Sibling', icon: '👯' },
  { id: 'parent', label: 'Parent', icon: '👨‍👧' },
  { id: 'child', label: 'Child', icon: '👶' },
  { id: 'cousin', label: 'Cousin', icon: '🤝' },
  { id: 'other', label: 'Other', icon: '💫' },
];

// Friend status types
export type FriendStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

// Categories appropriate for friends (excludes romance/spicy)
export const FRIEND_SAFE_CATEGORIES: QuestionCategory[] = ['daily_life', 'history', 'fun', 'deep_talks', 'custom'];

// Categories appropriate for family (excludes romance/spicy)
export const FAMILY_SAFE_CATEGORIES: QuestionCategory[] = ['daily_life', 'history', 'fun', 'deep_talks', 'custom'];

// Helper types
export type Tables = {
  users: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    profile_completed: boolean;
    created_at: string;
    updated_at: string;
  };
  couples: {
    id: string;
    partner_a_id: string;
    partner_b_id: string | null;
    invite_code: string;
    status: 'pending' | 'active' | 'paused';
    anniversary_date: string | null;
    relationship_stage: string;
    preferred_categories: QuestionCategory[];
    created_at: string;
    paired_at: string | null;
  };
  questions: {
    id: string;
    category: QuestionCategory;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    question: string;
    options: string[];
    is_active: boolean;
    // Audience flags for Friends & Family mode
    for_couples: boolean;
    for_friends: boolean;
    for_family: boolean;
  };
  custom_questions: {
    id: string;
    couple_id: string;
    category: 'custom';
    question: string;
    options: string[];
    created_by: string;
    is_active: boolean;
    created_at: string;
  };
  daily_sessions: {
    id: string;
    couple_id: string;
    question_id: string;
    user_a_answer: number | null;
    user_b_answer: number | null;
    is_match: boolean | null;
    completed_at: string | null;
    created_at: string;
  };
  game_sessions: {
    id: string;
    couple_id: string;
    mode: 'daily_sync' | 'date_night' | 'party_battle';
    status: 'in_progress' | 'completed' | 'abandoned';
    started_at: string;
    completed_at: string | null;
    total_questions: number;
    matched_count: number;
    score: number;
  };
  answers: {
    id: string;
    session_id: string;
    question_id: string;
    user_id: string;
    selected_option: number;
    answered_at: string;
  };
  streaks: {
    id: string;
    couple_id: string;
    current_streak: number;
    longest_streak: number;
    last_played_at: string | null;
    updated_at: string;
  };
  achievements: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    requirement_type: string;
    requirement_value: number;
  };
  user_achievements: {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: string;
  };
  couple_stats: {
    id: string;
    couple_id: string;
    total_games: number;
    total_matches: number;
    total_questions: number;
    sync_score: number;
    favorite_category: string | null;
    updated_at: string;
  };
  // Friends & Family Mode types
  friends: {
    id: string;
    user_id: string;
    friend_id: string | null;
    nickname: string | null;
    relationship_type: RelationshipType;
    status: FriendStatus;
    invite_code: string | null;
    invite_expires_at: string | null;
    preferred_categories: QuestionCategory[];
    daily_limit: number;
    created_at: string;
    accepted_at: string | null;
    updated_at: string;
  };
  friend_games: {
    id: string;
    friendship_id: string;
    question_id: string;
    game_date: string;
    question_number: number;
    status: 'waiting_initiator' | 'waiting_friend' | 'waiting_both' | 'completed' | 'expired' | 'skipped';
    initiator_answer: number | null;
    friend_answer: number | null;
    is_match: boolean | null;
    initiator_answered_at: string | null;
    friend_answered_at: string | null;
    created_at: string;
    completed_at: string | null;
    expires_at: string | null;
  };
};

// History item type for the history feature
export interface HistoryItem {
  id: string;
  question_id: string;
  question_text: string;
  question_category: QuestionCategory;
  options: string[];
  user_a_answer: number | null;
  user_b_answer: number | null;
  is_match: boolean | null;
  completed_at: string;
  created_at: string;
}

// Friend with user details (joined data)
export interface FriendWithUser {
  id: string;
  user_id: string;
  friend_id: string | null;
  nickname: string | null;
  relationship_type: RelationshipType;
  status: FriendStatus;
  invite_code: string | null;
  preferred_categories: QuestionCategory[];
  daily_limit: number;
  created_at: string;
  accepted_at: string | null;
  // Joined user data (friend's profile)
  friend_user?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    email: string;
  };
  // Count of active games today
  active_games_count?: number;
  // Count of games waiting for response
  pending_response_count?: number;
}

// Friend game with question details (joined data)
export interface FriendGameWithQuestion {
  id: string;
  friendship_id: string;
  question_id: string;
  game_date: string;
  question_number: number;
  status: 'waiting_initiator' | 'waiting_friend' | 'waiting_both' | 'completed' | 'expired' | 'skipped';
  initiator_answer: number | null;
  friend_answer: number | null;
  is_match: boolean | null;
  initiator_answered_at: string | null;
  friend_answered_at: string | null;
  created_at: string;
  completed_at: string | null;
  // Joined question data
  question?: {
    id: string;
    category: QuestionCategory;
    question: string;
    options: string[];
  };
}

// Helper to generate invite code
export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARS.charAt(Math.floor(Math.random() * INVITE_CODE_CHARS.length));
  }
  return code;
}
