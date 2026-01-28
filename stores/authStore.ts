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
    // Prevent re-initialization
    if (get().isInitialized) {
      console.log('[AuthStore] Already initialized, skipping');
      return;
    }
    
    console.log('[AuthStore] Initializing...');
    
    // Get Supabase client (will be created lazily on first call in browser)
    const supabase = getSupabase();
    
    if (!supabase) {
      console.warn('[AuthStore] No Supabase client available');
      set({ isLoading: false, isInitialized: true, error: 'Supabase not configured' });
      return;
    }
    
    try {
      // Get the current session first
      console.log('[AuthStore] Getting current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AuthStore] Session error:', sessionError);
        set({ isLoading: false, isInitialized: true, error: sessionError.message });
        return;
      }
      
      console.log('[AuthStore] Session from getSession:', session ? 'Found' : 'None');
      
      // Set up auth state listener for future changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('[AuthStore] Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          set({ session: null, user: null });
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            const client = getSupabase();
            if (client) {
              const { data: profile } = await client
                .from(TABLES.users)
                .select('*')
                .eq('id', newSession.user.id)
                .maybeSingle();
              
              set({ session: newSession, user: profile || null });
            }
          }
        }
      });
      
      // Process initial session
      if (session?.user) {
        console.log('[AuthStore] Fetching profile for:', session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from(TABLES.users)
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('[AuthStore] Profile error:', profileError);
        }
        
        console.log('[AuthStore] Profile loaded:', profile ? 'Yes' : 'No');
        set({ 
          session, 
          user: profile || null,
          isLoading: false,
          isInitialized: true 
        });
      } else {
        console.log('[AuthStore] No session, marking initialized');
        set({ 
          isLoading: false, 
          isInitialized: true,
          session: null,
          user: null 
        });
      }
      
    } catch (error) {
      console.error('[AuthStore] Initialization error:', error);
      set({ isLoading: false, isInitialized: true, error: String(error) });
    }
  },

  signUp: async (email, password, displayName) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (error) return { error };

      if (data.user) {
        await supabase
          .from(TABLES.users)
          .upsert({
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
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    try {
      console.log('[AuthStore] Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthStore] Sign in error:', error);
        return { error };
      }

      // Manually update state after sign in
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
    
    try {
      console.log('[AuthStore] Signing out...');
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  updateProfile: async (updates) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    const { user } = get();
    if (!user) return { error: { message: 'No user logged in' } };

    try {
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
