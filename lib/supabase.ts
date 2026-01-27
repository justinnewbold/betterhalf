import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug logging
console.log('[Supabase] URL configured:', !!supabaseUrl);
console.log('[Supabase] Key configured:', !!supabaseAnonKey);

// Storage key for session
const STORAGE_KEY = 'betterhalf-auth-token';

// Robust localStorage wrapper that handles all edge cases
const createWebStorage = () => {
  // Check if we're in a browser environment with localStorage
  const hasLocalStorage = typeof window !== 'undefined' && 
    typeof window.localStorage !== 'undefined';
  
  if (!hasLocalStorage) {
    console.log('[Supabase] localStorage not available, using memory storage');
    // Fallback to in-memory storage for SSR/build time
    const memoryStore: Record<string, string> = {};
    return {
      getItem: async (key: string): Promise<string | null> => {
        return memoryStore[key] || null;
      },
      setItem: async (key: string, value: string): Promise<void> => {
        memoryStore[key] = value;
      },
      removeItem: async (key: string): Promise<void> => {
        delete memoryStore[key];
      },
    };
  }

  console.log('[Supabase] Using localStorage for session persistence');
  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        const value = window.localStorage.getItem(key);
        console.log('[Supabase Storage] getItem:', key, value ? 'found' : 'not found');
        return value;
      } catch (error) {
        console.error('[Supabase Storage] getItem error:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        window.localStorage.setItem(key, value);
        console.log('[Supabase Storage] setItem:', key, 'saved');
      } catch (error) {
        console.error('[Supabase Storage] setItem error:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        window.localStorage.removeItem(key);
        console.log('[Supabase Storage] removeItem:', key);
      } catch (error) {
        console.error('[Supabase Storage] removeItem error:', error);
      }
    },
  };
};

// Create client with proper configuration
let _supabase: SupabaseClient | null = null;

const createSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing configuration - URL or Key not set');
    return null;
  }
  
  try {
    const storage = createWebStorage();
    
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: storage,
        storageKey: STORAGE_KEY,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    });
    console.log('[Supabase] Client created successfully with persistent storage');
    return client;
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error);
    return null;
  }
};

export const getSupabase = (): SupabaseClient | null => {
  if (!_supabase) {
    _supabase = createSupabaseClient();
  }
  return _supabase;
};

// Initialize immediately for web
export const supabase = createSupabaseClient();

// Table names with prefix for isolation
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
