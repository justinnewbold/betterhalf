import { create } from 'zustand';
import { supabase, TABLES, QuestionCategory } from '../lib/supabase';
import type { Tables } from '../lib/supabase';

type Question = Tables['questions'];
type GameSession = Tables['game_sessions'];
type Answer = Tables['answers'];

type GameMode = 'daily_sync' | 'date_night' | 'party_battle';

interface GameState {
  currentSession: GameSession | null;
  questions: Question[];
  currentQuestionIndex: number;
  myAnswers: Record<string, number>;
  partnerAnswers: Record<string, number>;
  isLoading: boolean;
  
  startGame: (coupleId: string, mode: GameMode) => Promise<{ error: any }>;
  loadQuestions: (categories?: QuestionCategory[]) => Promise<void>;
  submitAnswer: (questionId: string, userId: string, selectedOption: number) => Promise<{ error: any }>;
  completeGame: () => Promise<{ score: number; matched: number; error: any }>;
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
      if (!supabase) return { error: { message: 'Supabase not configured' } };
      
      set({ isLoading: true });

      const { data: session, error } = await supabase
        .from(TABLES.game_sessions)
        .insert({
          couple_id: coupleId,
          mode,
          total_questions: mode === 'daily_sync' ? 5 : 10,
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
      await get().loadQuestions();

      return { error: null };
    } catch (error) {
      set({ isLoading: false });
      return { error };
    }
  },

  loadQuestions: async (categories) => {
    try {
      if (!supabase) return;
      
      const { currentSession } = get();
      const limit = currentSession?.total_questions || 5;

      let query = supabase
        .from(TABLES.questions)
        .select('*')
        .eq('is_active', true);

      // Filter by categories if provided
      if (categories && categories.length > 0) {
        console.log('[GameStore] Loading questions for categories:', categories);
        query = query.in('category', categories);
      }

      const { data, error } = await query.limit(limit * 2); // Get more to have variety after shuffle

      if (error) {
        console.error('[GameStore] Load questions error:', error);
        return;
      }

      // Shuffle questions and take the needed amount
      const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, limit);
      console.log('[GameStore] Loaded', shuffled.length, 'questions');
      set({ questions: shuffled });
    } catch (error) {
      console.error('[GameStore] Load questions exception:', error);
    }
  },

  submitAnswer: async (questionId, userId, selectedOption) => {
    try {
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
