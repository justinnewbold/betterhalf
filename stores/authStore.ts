import { create } from 'zustand';
import { supabase, TABLES } from '../lib/supabase';
import type { Tables } from '../lib/supabase';

type User = Tables['users'];

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  initialize: async () => {
    console.log('[AuthStore] Initializing...');
    try {
      if (!supabase) {
        console.warn('[AuthStore] No Supabase client - running without auth');
        set({ isLoading: false, isInitialized: true, error: 'Supabase not configured' });
        return;
      }
      
      console.log('[AuthStore] Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AuthStore] Session error:', sessionError);
        set({ isLoading: false, isInitialized: true, error: sessionError.message });
        return;
      }
      
      console.log('[AuthStore] Session:', session ? 'Found' : 'None');
      
      if (session?.user) {
        console.log('[AuthStore] Fetching profile for:', session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from(TABLES.users)
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.warn('[AuthStore] Profile error (may not exist yet):', profileError);
        }
        
        set({ 
          session, 
          user: profile || null,
          isLoading: false,
          isInitialized: true 
        });
      } else {
        console.log('[AuthStore] No session, setting initialized');
        set({ isLoading: false, isInitialized: true });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthStore] Auth state changed:', event);
        if (session?.user) {
          const { data: profile } = await supabase
            .from(TABLES.users)
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          set({ session, user: profile || null });
        } else {
          set({ session: null, user: null });
        }
      });
    } catch (error) {
      console.error('[AuthStore] Initialization error:', error);
      set({ isLoading: false, isInitialized: true, error: String(error) });
    }
  },

  signUp: async (email, password, displayName) => {
    try {
      if (!supabase) return { error: { message: 'Supabase not configured' } };
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from(TABLES.users)
          .insert({
            id: data.user.id,
            email: data.user.email!,
            display_name: displayName,
          });

        if (profileError) return { error: profileError };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signIn: async (email, password) => {
    try {
      if (!supabase) return { error: { message: 'Supabase not configured' } };
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  },

  signOut: async () => {
    try {
      if (!supabase) return;
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  updateProfile: async (updates) => {
    try {
      if (!supabase) return { error: { message: 'Supabase not configured' } };
      
      const { user } = get();
      if (!user) return { error: { message: 'No user logged in' } };

      const { error } = await supabase
        .from(TABLES.users)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (!error) {
        set({ user: { ...user, ...updates } });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  },
}));
