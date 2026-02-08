import { create } from 'zustand';
import { getSupabase, TABLES, QuestionCategory } from '../lib/supabase';
import type { Tables } from '../lib/supabase';
import { loadGameQuestions, GameQuestion } from '../lib/questionService';
import { DAILY_SYNC_QUESTIONS, DATE_NIGHT_QUESTIONS } from '../constants/config';

type GameSession = Tables['game_sessions'];

type GameMode = 'daily_sync' | 'date_night' | 'party_battle';

interface GameState {
  currentSession: GameSession | null;
  questions: GameQuestion[];
  currentQuestionIndex: number;
  myAnswers: Record<string, number>;
  partnerAnswers: Record<string, number>;
  isLoading: boolean;
  
  startGame: (coupleId: string, mode: GameMode) => Promise<{ error: unknown }>;
  loadQuestions: (coupleId: string, categories?: QuestionCategory[]) => Promise<void>;
  submitAnswer: (questionId: string, userId: string, selectedOption: number) => Promise<{ error: unknown }>;
  completeGame: () => Promise<{ score: number; matched: number; error: unknown }>;
  nextQuestion: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentSession: null,
  questions: [],
  currentQuestionIndex: 0,
  myAnswers: {},
  partnerAnswers: {},
  isLoading: false,

  startGame: async (coupleId, mode) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return { error: { message: 'Supabase not configured' } };

      set({ isLoading: true });

      const { data: session, error } = await supabase
        .from(TABLES.game_sessions)
        .insert({
          couple_id: coupleId,
          mode,
          total_questions: mode === 'daily_sync' ? DAILY_SYNC_QUESTIONS : DATE_NIGHT_QUESTIONS,
        })
        .select()
        .single();

      if (error) {
        set({ isLoading: false });
        return { error };
      }

      set({ 
        currentSession: session, 
        currentQuestionIndex: 0,
        myAnswers: {},
        partnerAnswers: {},
        isLoading: false 
      });

      // Load questions for the game
      await get().loadQuestions(coupleId);

      return { error: null };
    } catch (error) {
      set({ isLoading: false });
      return { error };
    }
  },

  loadQuestions: async (coupleId, categories) => {
    try {
      const { currentSession } = get();
      const limit = currentSession?.total_questions || DAILY_SYNC_QUESTIONS;

      const { questions, error } = await loadGameQuestions({
        coupleId,
        categories,
        limit,
      });

      if (error) {
        console.error('[GameStore] Load questions error:', error);
      }

      set({ questions });
    } catch (error) {
      console.error('[GameStore] Load questions exception:', error);
    }
  },

  submitAnswer: async (questionId, userId, selectedOption) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return { error: { message: 'Supabase not configured' } };

      const { currentSession, myAnswers } = get();
      if (!currentSession) return { error: { message: 'No active session' } };

      const { error } = await supabase
        .from(TABLES.answers)
        .insert({
          session_id: currentSession.id,
          question_id: questionId,
          user_id: userId,
          selected_option: selectedOption,
        });

      if (!error) {
        set({ myAnswers: { ...myAnswers, [questionId]: selectedOption } });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  },

  completeGame: async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return { score: 0, matched: 0, error: { message: 'Supabase not configured' } };

      const { currentSession, myAnswers, partnerAnswers, questions } = get();
      if (!currentSession) return { score: 0, matched: 0, error: { message: 'No active session' } };

      // Calculate matches
      let matched = 0;
      questions.forEach(q => {
        if (myAnswers[q.id] !== undefined && 
            partnerAnswers[q.id] !== undefined && 
            myAnswers[q.id] === partnerAnswers[q.id]) {
          matched++;
        }
      });

      const score = Math.round((matched / questions.length) * 100);

      const { error } = await supabase
        .from(TABLES.game_sessions)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          matched_count: matched,
          score,
        })
        .eq('id', currentSession.id);

      return { score, matched, error };
    } catch (error) {
      return { score: 0, matched: 0, error };
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  resetGame: () => {
    set({
      currentSession: null,
      questions: [],
      currentQuestionIndex: 0,
      myAnswers: {},
      partnerAnswers: {},
    });
  },
}));
