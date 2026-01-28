import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter that works for both web and native
const ExpoStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

// Singleton Supabase client
let _supabase: SupabaseClient | null = null;

const createSupabaseClient = (): SupabaseClient | null => {
  if (_supabase) return _supabase;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing configuration');
    return null;
  }
  
  // Skip creation during SSR
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return null;
  }
  
  try {
    console.log('[Supabase] Creating client, platform:', Platform.OS);
    
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
    
    console.log('[Supabase] Client created');
    return _supabase;
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error);
    return null;
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
  game_sessions: 'betterhalf_game_sessions',
  answers: 'betterhalf_answers',
  streaks: 'betterhalf_streaks',
  achievements: 'betterhalf_achievements',
  user_achievements: 'betterhalf_user_achievements',
  couple_stats: 'betterhalf_couple_stats',
} as const;

// Helper types
export type Tables = {
  users: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
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
    created_at: string;
    paired_at: string | null;
  };
  questions: {
    id: string;
    category: 'daily_life' | 'heart' | 'history' | 'spice' | 'fun';
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    question: string;
    options: string[];
    is_active: boolean;
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
};
