import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  couple: {
    id: string;
    partnerId: string | null;
    partnerName: string | null;
    inviteCode: string;
    status: string;
  } | null;
  
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchCouple: () => Promise<void>;
  createInviteCode: () => Promise<string | null>;
  joinWithCode: (code: string) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,
  couple: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, isLoading: false, isInitialized: true });
      
      if (session?.user) {
        await get().fetchCouple();
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) {
          await get().fetchCouple();
        } else {
          set({ couple: null });
        }
      });
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName }
        }
      });
      
      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }
      
      // Create user profile
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName,
        });
      }
      
      set({ isLoading: false });
      return { error: null };
    } catch (err: any) {
      set({ isLoading: false });
      return { error: err.message || 'Sign up failed' };
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      set({ isLoading: false });
      return { error: error?.message || null };
    } catch (err: any) {
      set({ isLoading: false });
      return { error: err.message || 'Sign in failed' };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, couple: null });
  },

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  fetchCouple: async () => {
    const { user } = get();
    if (!user) return;

    const { data } = await supabase
      .from('couples')
      .select('*, partner_a:users!partner_a_id(display_name), partner_b:users!partner_b_id(display_name)')
      .or(`partner_a_id.eq.${user.id},partner_b_id.eq.${user.id}`)
      .single();

    if (data) {
      const isPartnerA = data.partner_a_id === user.id;
      set({
        couple: {
          id: data.id,
          partnerId: isPartnerA ? data.partner_b_id : data.partner_a_id,
          partnerName: isPartnerA 
            ? (data.partner_b as any)?.display_name 
            : (data.partner_a as any)?.display_name,
          inviteCode: data.invite_code,
          status: data.status,
        }
      });
    }
  },

  createInviteCode: async () => {
    const { user } = get();
    if (!user) return null;

    // Generate 6-char code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase
      .from('couples')
      .insert({
        partner_a_id: user.id,
        invite_code: code,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invite:', error);
      return null;
    }

    set({
      couple: {
        id: data.id,
        partnerId: null,
        partnerName: null,
        inviteCode: code,
        status: 'pending'
      }
    });

    return code;
  },

  joinWithCode: async (code) => {
    const { user } = get();
    if (!user) return { error: 'Not logged in' };

    // Find couple with this code
    const { data: coupleData, error: findError } = await supabase
      .from('couples')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .eq('status', 'pending')
      .single();

    if (findError || !coupleData) {
      return { error: 'Invalid or expired invite code' };
    }

    if (coupleData.partner_a_id === user.id) {
      return { error: 'You cannot join your own couple' };
    }

    // Join the couple
    const { error: updateError } = await supabase
      .from('couples')
      .update({
        partner_b_id: user.id,
        status: 'active',
        paired_at: new Date().toISOString()
      })
      .eq('id', coupleData.id);

    if (updateError) {
      return { error: 'Failed to join couple' };
    }

    await get().fetchCouple();
    return { error: null };
  },
}));
