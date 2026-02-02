import { create } from 'zustand';
import { getSupabase, TABLES } from '../lib/supabase';
import type { Tables } from '../lib/supabase';

type Achievement = Tables['achievements'];
type UserAchievement = Tables['user_achievements'];

interface NewlyUnlocked {
  achievement: Achievement;
  unlockedAt: string;
}

interface AchievementState {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  newlyUnlocked: NewlyUnlocked[];
  isLoading: boolean;
  hasFetched: boolean;

  fetchAchievements: (userId: string) => Promise<void>;
  checkAndUnlock: (userId: string, stats: {
    currentStreak: number;
    totalGames: number;
    totalMatches: number;
    perfectDay?: boolean;
  }) => Promise<NewlyUnlocked[]>;
  dismissCelebration: () => void;
  isUnlocked: (achievementId: string) => boolean;
  getProgress: (achievement: Achievement, stats: {
    currentStreak: number;
    totalGames: number;
    totalMatches: number;
  }) => number;
  reset: () => void;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [],
  userAchievements: [],
  newlyUnlocked: [],
  isLoading: false,
  hasFetched: false,

  fetchAchievements: async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;

    const state = get();
    if (state.isLoading || state.hasFetched) return;

    set({ isLoading: true });

    try {
      // Fetch all achievement definitions
      const { data: achievements, error: achError } = await supabase
        .from(TABLES.achievements)
        .select('*')
        .order('requirement_type')
        .order('requirement_value');

      if (achError) {
        console.error('[AchievementStore] Fetch achievements error:', achError);
        set({ isLoading: false, hasFetched: true });
        return;
      }

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: uaError } = await supabase
        .from(TABLES.user_achievements)
        .select('*')
        .eq('user_id', userId);

      if (uaError) {
        console.error('[AchievementStore] Fetch user achievements error:', uaError);
      }

      set({
        achievements: achievements || [],
        userAchievements: userAchievements || [],
        isLoading: false,
        hasFetched: true,
      });
    } catch (err) {
      console.error('[AchievementStore] Error:', err);
      set({ isLoading: false, hasFetched: true });
    }
  },

  checkAndUnlock: async (userId, stats) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return [];

    const { achievements, userAchievements } = get();
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const newlyUnlocked: NewlyUnlocked[] = [];

    for (const achievement of achievements) {
      // Skip already unlocked
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.requirement_type) {
        case 'streak':
          shouldUnlock = stats.currentStreak >= achievement.requirement_value;
          break;
        case 'games':
          shouldUnlock = stats.totalGames >= achievement.requirement_value;
          break;
        case 'matches':
          shouldUnlock = stats.totalMatches >= achievement.requirement_value;
          break;
        case 'special':
          if (achievement.name === 'First Match') {
            shouldUnlock = stats.totalMatches >= 1;
          } else if (achievement.name === 'Perfect Day') {
            shouldUnlock = stats.perfectDay === true;
          }
          break;
      }

      if (shouldUnlock) {
        const now = new Date().toISOString();
        
        // Insert into database
        const { error } = await supabase
          .from(TABLES.user_achievements)
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
          });

        if (!error) {
          const newUA: UserAchievement = {
            id: crypto.randomUUID?.() || `temp-${Date.now()}`,
            user_id: userId,
            achievement_id: achievement.id,
            unlocked_at: now,
          };

          newlyUnlocked.push({
            achievement,
            unlockedAt: now,
          });

          // Update local state
          set(state => ({
            userAchievements: [...state.userAchievements, newUA],
          }));
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      set({ newlyUnlocked });
    }

    return newlyUnlocked;
  },

  dismissCelebration: () => {
    set({ newlyUnlocked: [] });
  },

  isUnlocked: (achievementId: string) => {
    return get().userAchievements.some(ua => ua.achievement_id === achievementId);
  },

  getProgress: (achievement, stats) => {
    switch (achievement.requirement_type) {
      case 'streak':
        return Math.min(stats.currentStreak / achievement.requirement_value, 1);
      case 'games':
        return Math.min(stats.totalGames / achievement.requirement_value, 1);
      case 'matches':
        return Math.min(stats.totalMatches / achievement.requirement_value, 1);
      case 'special':
        if (achievement.name === 'First Match') return stats.totalMatches > 0 ? 1 : 0;
        return 0;
      default:
        return 0;
    }
  },

  reset: () => {
    set({
      achievements: [],
      userAchievements: [],
      newlyUnlocked: [],
      isLoading: false,
      hasFetched: false,
    });
  },
}));
