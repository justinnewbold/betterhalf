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
    // Prevent re-initialization
    if (get().isInitialized) {
      console.log('[AuthStore] Already initialized, skipping');
      return;
    }
    
    console.log('[AuthStore] Initializing...');
    
    try {
      if (!supabase) {
        console.warn('[AuthStore] No Supabase client - running without auth');
        set({ isLoading: false, isInitialized: true, error: 'Supabase not configured' });
        return;
      }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthStore] Auth state changed:', event, session ? 'has session' : 'no session');
        
        if (event === 'SIGNED_OUT') {
          set({ session: null, user: null });
          return;
        }
        
        // Handle INITIAL_SESSION - this is the session restoration on page load
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from(TABLES.users)
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (profileError && profileError.code !== 'PGRST116') {
              console.warn('[AuthStore] Profile fetch error:', profileError);
            }
            
            console.log('[AuthStore] Setting session and user from', event);
            set({ 
              session, 
              user: profile || null,
              isLoading: false,
              isInitialized: true 
            });
          } else {
            set({ 
              session: null, 
              user: null,
              isLoading: false,
              isInitialized: true 
            });
          }
        }
      });

      // Get the current session - this will also trigger INITIAL_SESSION event
      console.log('[AuthStore] Getting current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AuthStore] Session error:', sessionError);
        set({ isLoading: false, isInitialized: true, error: sessionError.message });
        return;
      }
      
      console.log('[AuthStore] Current session from getSession:', session ? 'Found' : 'None');
      
      // If no session, we're done - no need to wait for INITIAL_SESSION
      if (!session) {
        console.log('[AuthStore] No session found, setting initialized');
        set({ 
          isLoading: false, 
          isInitialized: true,
          session: null,
          user: null 
        });
        return;
      }
      
      // Session exists - fetch user profile
      console.log('[AuthStore] Fetching profile for:', session.user.id);
      const { data: profile, error: profileError } = await supabase
        .from(TABLES.users)
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('[AuthStore] Profile error:', profileError);
      }
      
      console.log('[AuthStore] Setting initial state with session and profile');
      set({ 
        session, 
        user: profile || null,
        isLoading: false,
        isInitialized: true 
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
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) return { error };

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from(TABLES.users)
          .upsert({
            id: data.user.id,
            email: data.user.email!,
            display_name: displayName,
          }, { onConflict: 'id' });

        if (profileError) {
          console.error('[AuthStore] Profile creation error:', profileError);
          // Don't return error - the trigger might have created it
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signIn: async (email, password) => {
    try {
      if (!supabase) return { error: { message: 'Supabase not configured' } };
      
      console.log('[AuthStore] Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthStore] Sign in error:', error);
        return { error };
      }

      console.log('[AuthStore] Sign in successful, session:', data.session ? 'created' : 'none');
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signOut: async () => {
    try {
      if (!supabase) return;
      console.log('[AuthStore] Signing out...');
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
