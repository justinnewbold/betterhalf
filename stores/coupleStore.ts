import { create } from 'zustand';
import { getSupabase, TABLES, QuestionCategory } from '../lib/supabase';
import type { Tables } from '../lib/supabase';
import { useDevStore } from './devStore';

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
  lastFetchUserId: string | null;
  
  fetchCouple: (userId: string) => Promise<void>;
  refreshCoupleData: () => Promise<void>;
  loadStats: () => Promise<void>;
  createCouple: (userId: string) => Promise<{ inviteCode: string | null; error: unknown }>;
  joinCouple: (userId: string, inviteCode: string) => Promise<{ error: unknown }>;
  updateCouple: (updates: Partial<Couple>) => Promise<{ error: unknown }>;
  updateCategoryPreferences: (categories: QuestionCategory[]) => Promise<{ error: unknown }>;
  reset: () => void;
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  couple: null,
  stats: null,
  streak: null,
  partnerProfile: null,
  isLoading: false,
  hasFetched: false,
  lastFetchUserId: null,

  fetchCouple: async (userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) {
      console.log('[CoupleStore] No supabase or userId');
      set({ isLoading: false, hasFetched: true });
      return;
    }
    
    // Prevent duplicate fetches for the same user
    const state = get();
    if (state.isLoading) {
      console.log('[CoupleStore] Already fetching, skipping');
      return;
    }
    
    // If we already fetched for this user, don't refetch unless reset
    if (state.hasFetched && state.lastFetchUserId === userId) {
      console.log('[CoupleStore] Already fetched for this user');
      return;
    }
    
    set({ isLoading: true, lastFetchUserId: userId });
    console.log('[CoupleStore] Fetching couple for user:', userId);

    try {
      const { data: couple, error } = await supabase
        .from(TABLES.couples)
        .select('*')
        .or(`partner_a_id.eq.${userId},partner_b_id.eq.${userId}`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[CoupleStore] Fetch couple error:', error);
        set({ couple: null, partnerProfile: null, stats: null, streak: null, isLoading: false, hasFetched: true });
        return;
      }

      console.log('[CoupleStore] Found couple:', couple?.id, 'status:', couple?.status);

      if (couple) {
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

        const { data: stats } = await supabase
          .from(TABLES.couple_stats)
          .select('*')
          .eq('couple_id', couple.id)
          .maybeSingle();

        const { data: streak } = await supabase
          .from(TABLES.streaks)
          .select('*')
          .eq('couple_id', couple.id)
          .maybeSingle();

        set({ couple, partnerProfile, stats, streak, isLoading: false, hasFetched: true });
      } else {
        console.log('[CoupleStore] No couple found for user');
        set({ couple: null, partnerProfile: null, stats: null, streak: null, isLoading: false, hasFetched: true });
      }
    } catch (error) {
      console.error('[CoupleStore] Fetch couple exception:', error);
      set({ couple: null, partnerProfile: null, stats: null, streak: null, isLoading: false, hasFetched: true });
    }
  },

  refreshCoupleData: async () => {
    const state = get();
    const userId = state.lastFetchUserId;
    if (!userId) return;
    // Reset fetch flags to force a fresh fetch
    set({ hasFetched: false, lastFetchUserId: null });
    await get().fetchCouple(userId);
  },

  loadStats: async () => {
    const supabase = getSupabase();
    const { couple } = get();
    if (!supabase || !couple?.id) return;

    try {
      const { data: stats } = await supabase
        .from(TABLES.couple_stats)
        .select('*')
        .eq('couple_id', couple.id)
        .maybeSingle();

      const { data: streak } = await supabase
        .from(TABLES.streaks)
        .select('*')
        .eq('couple_id', couple.id)
        .maybeSingle();

      set({ stats, streak });
    } catch (error) {
      console.error('[CoupleStore] Load stats error:', error);
    }
  },

  createCouple: async (userId) => {
    const supabase = getSupabase();
    if (!supabase) return { inviteCode: null, error: { message: 'Supabase not configured' } };
    
    console.log('[CoupleStore] Creating couple for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from(TABLES.couples)
        .insert({
          partner_a_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('[CoupleStore] Create couple error:', error);
        return { inviteCode: null, error };
      }

      console.log('[CoupleStore] Created couple with code:', data.invite_code);

      // Create stats entry
      await supabase
        .from(TABLES.couple_stats)
        .insert({ couple_id: data.id });

      // Create streak entry
      await supabase
        .from(TABLES.streaks)
        .insert({ couple_id: data.id });

      set({ couple: data, hasFetched: true });
      return { inviteCode: data.invite_code, error: null };
    } catch (error) {
      console.error('[CoupleStore] Create couple exception:', error);
      return { inviteCode: null, error };
    }
  },

  joinCouple: async (userId, inviteCode) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    const cleanCode = inviteCode.trim().toUpperCase();
    console.log('[CoupleStore] Joining couple with code:', cleanCode, 'user:', userId);
    
    try {
      // First find the couple with this invite code
      console.log('[CoupleStore] Looking for couple with code:', cleanCode);
      const { data: couple, error: findError } = await supabase
        .from(TABLES.couples)
        .select('*')
        .eq('invite_code', cleanCode)
        .eq('status', 'pending')
        .is('partner_b_id', null)
        .maybeSingle();

      console.log('[CoupleStore] Find result:', couple, 'error:', findError);

      if (findError) {
        console.error('[CoupleStore] Find couple error:', findError);
        return { error: { message: 'Error finding invite code: ' + findError.message } };
      }

      if (!couple) {
        console.log('[CoupleStore] No couple found with code:', cleanCode);
        return { error: { message: 'Invalid or expired invite code' } };
      }

      // Check if user is trying to join their own couple
      if (couple.partner_a_id === userId && !useDevStore.getState().devMode) {
        return { error: { message: 'You cannot join your own couple!' } };
      }

      console.log('[CoupleStore] Found couple:', couple.id, 'updating with partner_b:', userId);

      // Join the couple
      const { data: updatedCouple, error: updateError } = await supabase
        .from(TABLES.couples)
        .update({
          partner_b_id: userId,
          status: 'active',
          paired_at: new Date().toISOString(),
        })
        .eq('id', couple.id)
        .select()
        .single();

      console.log('[CoupleStore] Update result:', updatedCouple, 'error:', updateError);

      if (updateError) {
        console.error('[CoupleStore] Join couple error:', updateError);
        return { error: { message: 'Failed to join: ' + updateError.message } };
      }

      // Reset hasFetched to force a fresh fetch
      set({ couple: updatedCouple, hasFetched: false, lastFetchUserId: null });
      await get().fetchCouple(userId);

      console.log('[CoupleStore] Successfully joined couple!');
      return { error: null };
    } catch (error: unknown) {
      console.error('[CoupleStore] Join couple exception:', error);
      return { error: { message: error instanceof Error ? error.message : 'Unknown error joining couple' } };
    }
  },

  updateCouple: async (updates) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    const { couple } = get();
    if (!couple) return { error: { message: 'No couple found' } };

    try {
      const { error } = await supabase
        .from(TABLES.couples)
        .update(updates)
        .eq('id', couple.id);

      if (!error) {
        set(state => ({ couple: state.couple ? { ...state.couple, ...updates } : state.couple }));
      }

      return { error };
    } catch (error) {
      return { error };
    }
  },

  updateCategoryPreferences: async (categories) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: 'Supabase not configured' } };

    const { couple } = get();
    if (!couple) return { error: { message: 'No couple found' } };

    console.log('[CoupleStore] Updating category preferences:', categories);

    try {
      const { error } = await supabase
        .from(TABLES.couples)
        .update({ preferred_categories: categories })
        .eq('id', couple.id);

      if (!error) {
        set(state => ({ couple: state.couple ? { ...state.couple, preferred_categories: categories } : state.couple }));
        console.log('[CoupleStore] Category preferences updated successfully');
      } else {
        console.error('[CoupleStore] Category update error:', error);
      }

      return { error };
    } catch (error) {
      console.error('[CoupleStore] Category update exception:', error);
      return { error };
    }
  },

  reset: () => {
    console.log('[CoupleStore] Resetting store');
    set({ couple: null, stats: null, streak: null, partnerProfile: null, isLoading: false, hasFetched: false, lastFetchUserId: null });
  },
}));
