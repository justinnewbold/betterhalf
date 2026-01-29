import { create } from 'zustand';
import { getSupabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type PresenceState = 'online' | 'away' | 'playing' | 'offline';

interface PresencePayload {
  user_id: string;
  display_name: string;
  state: PresenceState;
  current_screen?: string;
  last_seen: string;
}

interface PresenceStore {
  myState: PresenceState;
  currentScreen: string;
  partnerState: PresenceState;
  partnerLastSeen: string | null;
  partnerCurrentScreen: string | null;
  channel: RealtimeChannel | null;
  isConnected: boolean;
  initializePresence: (userId: string, coupleId: string, displayName: string) => void;
  updateMyState: (state: PresenceState, screen?: string) => void;
  disconnect: () => void;
  reset: () => void;
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  myState: 'offline',
  currentScreen: 'home',
  partnerState: 'offline',
  partnerLastSeen: null,
  partnerCurrentScreen: null,
  channel: null,
  isConnected: false,

  initializePresence: (userId, coupleId, displayName) => {
    const supabase = getSupabase();
    if (!supabase || !coupleId) {
      console.log('[Presence] No supabase or coupleId');
      return;
    }

    const existingChannel = get().channel;
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    console.log('[Presence] Initializing for couple:', coupleId);

    const channel = supabase.channel(`couple:${coupleId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('[Presence] Sync:', state);
      
      const presenceEntries = Object.entries(state);
      for (const [key, value] of presenceEntries) {
        if (key !== userId && Array.isArray(value) && value.length > 0) {
          const partnerPresence = value[0] as PresencePayload;
          set({
            partnerState: partnerPresence.state || 'online',
            partnerLastSeen: partnerPresence.last_seen,
            partnerCurrentScreen: partnerPresence.current_screen || null,
          });
        }
      }
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('[Presence] Join:', key, newPresences);
      if (key !== userId && newPresences.length > 0) {
        const partnerPresence = newPresences[0] as PresencePayload;
        set({
          partnerState: partnerPresence.state || 'online',
          partnerLastSeen: partnerPresence.last_seen,
          partnerCurrentScreen: partnerPresence.current_screen || null,
        });
      }
    });

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      console.log('[Presence] Leave:', key);
      if (key !== userId) {
        set({
          partnerState: 'offline',
          partnerLastSeen: new Date().toISOString(),
          partnerCurrentScreen: null,
        });
      }
    });

    channel.subscribe(async (status) => {
      console.log('[Presence] Channel status:', status);
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          display_name: displayName,
          state: 'online' as PresenceState,
          current_screen: 'home',
          last_seen: new Date().toISOString(),
        });
        set({ isConnected: true, myState: 'online' });
      }
    });

    set({ channel });
  },

  updateMyState: async (state, screen) => {
    const { channel, currentScreen } = get();
    if (!channel) return;

    const newScreen = screen || currentScreen;
    
    try {
      await channel.track({
        state,
        current_screen: newScreen,
        last_seen: new Date().toISOString(),
      });
      set({ myState: state, currentScreen: newScreen });
    } catch (error) {
      console.error('[Presence] Failed to update state:', error);
    }
  },

  disconnect: () => {
    const supabase = getSupabase();
    const { channel } = get();
    
    if (supabase && channel) {
      console.log('[Presence] Disconnecting');
      supabase.removeChannel(channel);
    }
    
    set({ channel: null, isConnected: false, myState: 'offline', partnerState: 'offline' });
  },

  reset: () => {
    get().disconnect();
    set({
      myState: 'offline',
      currentScreen: 'home',
      partnerState: 'offline',
      partnerLastSeen: null,
      partnerCurrentScreen: null,
      channel: null,
      isConnected: false,
    });
  },
}));
