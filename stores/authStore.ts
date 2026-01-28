import { create } from 'zustand';
import { getSupabase, TABLES } from '../lib/supabase';
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
    if (get().isInitialized) {
      console.log('[AuthStore] Already initialized');
      return;
    }
    
    console.log('[AuthStore] Initializing...');
    const supabase = getSupabase();
    
    if (!supabase) {
      console.warn('[AuthStore] No Supabase client');
      set({ isLoading: false, isInitialized: true, error: 'Supabase not configured' });
      return;
    }
    
    try {
      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthStore] Auth event:', event);
        
        if (event === 'SIGNED_OUT') {
          set({ session: null, user: null });
          return;
        }
        
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          const client = getSupabase();
          if (client) {
            const { data: profile } = await client
              .from(TABLES.users)
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            set({ session, user: profile || null });
          }
        }
      });

      // Get current session
      console.log('[AuthStore] Getting session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthStore] Session error:', error);
        set({ isLoading: false, isInitialized: true, error: error.message });
        return;
      }
      
      console.log('[AuthStore] Session:', session ? 'exists' : 'none');
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from(TABLES.users)
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        console.log('[AuthStore] Profile loaded');
        set({ session, user: profile || null, isLoading: false, isInitialized: true });
      } else {
        set({ session: null, user: null, isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('[AuthStore] Init error:', error);
      set({ isLoading: false, isInitialized: true, error: String(error) });
    }
  },

  signUp: async (email, password, displayName) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: 'Not configured' } };
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });

      if (error) return { error };

      if (data.user) {
        await supabase.from(TABLES.users).upsert({
          id: data.user.id,
          email: data.user.email!,
          display_name: displayName,
        }, { onConflict: 'id' });
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signIn: async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: 'Not configured' } };
    
    try {
      console.log('[AuthStore] Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { error };

      if (data.session?.user) {
        const { data: profile } = await supabase
          .from(TABLES.users)
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();
        set({ session: data.session, user: profile || null });
      }

      console.log('[AuthStore] Sign in successful');
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    console.log('[AuthStore] Signing out...');
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  updateProfile: async (updates) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: 'Not configured' } };
    
    const { user } = get();
    if (!user) return { error: { message: 'Not logged in' } };

    try {
      const { error } = await supabase
        .from(TABLES.users)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (!error) set({ user: { ...user, ...updates } });
      return { error };
    } catch (error) {
      return { error };
    }
  },
}));
