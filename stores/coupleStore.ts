import { create } from 'zustand';
import { supabase, TABLES } from '../lib/supabase';
import type { Tables } from '../lib/supabase';

type Couple = Tables['couples'];
type CoupleStats = Tables['couple_stats'];
type Streak = Tables['streaks'];

interface CoupleState {
  couple: Couple | null;
  stats: CoupleStats | null;
  streak: Streak | null;
  partnerProfile: Tables['users'] | null;
  isLoading: boolean;
  hasFetched: boolean;
  
  fetchCouple: (userId: string) => Promise<void>;
  createCouple: (userId: string) => Promise<{ inviteCode: string | null; error: any }>;
  joinCouple: (userId: string, inviteCode: string) => Promise<{ error: any }>;
  updateCouple: (updates: Partial<Couple>) => Promise<{ error: any }>;
  reset: () => void;
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  couple: null,
  stats: null,
  streak: null,
  partnerProfile: null,
  isLoading: false,
  hasFetched: false,

  fetchCouple: async (userId) => {
    if (!supabase || !userId) {
      set({ isLoading: false, hasFetched: true });
      return;
    }
    
    set({ isLoading: true });

    try {
      // Find couple where user is either partner - use maybeSingle() for optional result
      const { data: couple, error } = await supabase
        .from(TABLES.couples)
        .select('*')
        .or(`partner_a_id.eq.${userId},partner_b_id.eq.${userId}`)
        .maybeSingle();

      // Handle error but not "no rows" which is expected for new users
      if (error && error.code !== 'PGRST116') {
        console.error('Fetch couple error:', error);
        set({ couple: null, partnerProfile: null, stats: null, streak: null, isLoading: false, hasFetched: true });
        return;
      }

      if (couple) {
        // Get partner profile
        const partnerId = couple.partner_a_id === userId 
          ? couple.partner_b_id 
          : couple.partner_a_id;
        
        let partnerProfile = null;
        if (partnerId) {
          const { data } = await supabase
            .from(TABLES.users)
            .select('*')
            .eq('id', partnerId)
            .maybeSingle();
          partnerProfile = data;
        }

        // Get stats
        const { data: stats } = await supabase
          .from(TABLES.couple_stats)
          .select('*')
          .eq('couple_id', couple.id)
          .maybeSingle();

        // Get streak
        const { data: streak } = await supabase
          .from(TABLES.streaks)
          .select('*')
          .eq('couple_id', couple.id)
          .maybeSingle();

        set({ couple, partnerProfile, stats, streak, isLoading: false, hasFetched: true });
      } else {
        // No couple found - this is normal for new users
        set({ couple: null, partnerProfile: null, stats: null, streak: null, isLoading: false, hasFetched: true });
      }
    } catch (error) {
      console.error('Fetch couple error:', error);
      set({ couple: null, isLoading: false, hasFetched: true });
    }
  },

  createCouple: async (userId) => {
    if (!supabase) return { inviteCode: null, error: { message: 'Supabase not configured' } };
    
    try {
      const { data, error } = await supabase
        .from(TABLES.couples)
        .insert({
          partner_a_id: userId,
        })
        .select()
        .single();

      if (error) return { inviteCode: null, error };

      // Create stats entry
      await supabase
        .from(TABLES.couple_stats)
        .insert({ couple_id: data.id });

      // Create streak entry
      await supabase
        .from(TABLES.streaks)
        .insert({ couple_id: data.id });

      set({ couple: data });
      return { inviteCode: data.invite_code, error: null };
    } catch (error) {
      return { inviteCode: null, error };
    }
  },

  joinCouple: async (userId, inviteCode) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    try {
      // Find couple with invite code
      const { data: couple, error: findError } = await supabase
        .from(TABLES.couples)
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .is('partner_b_id', null)
        .maybeSingle();

      if (findError || !couple) {
        return { error: { message: 'Invalid or expired invite code' } };
      }

      // Join the couple
      const { error } = await supabase
        .from(TABLES.couples)
        .update({
          partner_b_id: userId,
          status: 'active',
          paired_at: new Date().toISOString(),
        })
        .eq('id', couple.id);

      if (!error) {
        await get().fetchCouple(userId);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  },

  updateCouple: async (updates) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    const { couple } = get();
    if (!couple) return { error: { message: 'No couple found' } };

    try {
      const { error } = await supabase
        .from(TABLES.couples)
        .update(updates)
        .eq('id', couple.id);

      if (!error) {
        set({ couple: { ...couple, ...updates } });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  },

  reset: () => {
    set({ couple: null, stats: null, streak: null, partnerProfile: null, isLoading: false, hasFetched: false });
  },
}));
