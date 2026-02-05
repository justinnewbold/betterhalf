import { create } from 'zustand';
import { getSupabase, TABLES, QuestionCategory } from '../lib/supabase';
import type { Tables } from '../lib/supabase';

type Question = Tables['questions'];
type CustomQuestion = Tables['custom_questions'];
type GameSession = Tables['game_sessions'];
type Answer = Tables['answers'];

// Union type for both regular and custom questions
type GameQuestion = {
  id: string;
  category: QuestionCategory;
  question: string;
  options: string[];
  isCustom?: boolean;
};

type GameMode = 'daily_sync' | 'date_night' | 'party_battle';

interface GameState {
  currentSession: GameSession | null;
  questions: GameQuestion[];
  currentQuestionIndex: number;
  myAnswers: Record<string, number>;
  partnerAnswers: Record<string, number>;
  isLoading: boolean;
  
  startGame: (coupleId: string, mode: GameMode) => Promise<{ error: any }>;
  loadQuestions: (coupleId: string, categories?: QuestionCategory[]) => Promise<void>;
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
      const supabase = getSupabase();
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
      await get().loadQuestions(coupleId);

      return { error: null };
    } catch (error) {
      set({ isLoading: false });
      return { error };
    }
  },

  loadQuestions: async (coupleId, categories) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { currentSession } = get();
      const limit = currentSession?.total_questions || 5;

      // Load regular questions
      let regularQuery = supabase
        .from(TABLES.questions)
        .select('*')
        .eq('is_active', true);

      // Filter by categories if provided (exclude 'custom' from regular query)
      const regularCategories = categories?.filter(c => c !== 'custom') || [];
      if (regularCategories.length > 0) {
        console.log('[GameStore] Loading questions for categories:', regularCategories);
        regularQuery = regularQuery.in('category', regularCategories);
      }

      const { data: regularQuestions, error: regularError } = await regularQuery.limit(limit * 2);

      if (regularError) {
        console.error('[GameStore] Load regular questions error:', regularError);
      }

      // Load custom questions if 'custom' category is enabled or no categories specified
      let customQuestions: CustomQuestion[] = [];
      const includeCustom = !categories || categories.length === 0 || categories.includes('custom');
      
      if (includeCustom && coupleId) {
        console.log('[GameStore] Loading custom questions for couple:', coupleId);
        const { data: customData, error: customError } = await supabase
          .from(TABLES.custom_questions)
          .select('*')
          .eq('couple_id', coupleId)
          .eq('is_active', true);

        if (customError) {
          console.error('[GameStore] Load custom questions error:', customError);
        } else {
          customQuestions = customData || [];
          console.log('[GameStore] Found', customQuestions.length, 'custom questions');
        }
      }

      // Transform questions to unified format
      const transformedRegular: GameQuestion[] = (regularQuestions || []).map(q => ({
        id: q.id,
        category: q.category as QuestionCategory,
        question: q.question,
        options: q.options as string[],
        isCustom: false,
      }));

      const transformedCustom: GameQuestion[] = customQuestions.map(q => ({
        id: q.id,
        category: 'custom' as QuestionCategory,
        question: q.question,
        options: q.options as string[],
        isCustom: true,
      }));

      // Combine and shuffle all questions
      const allQuestions = [...transformedRegular, ...transformedCustom];
      const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, limit);
      
      console.log('[GameStore] Loaded', shuffled.length, 'total questions (',
        transformedCustom.length, 'custom,',
        transformedRegular.length, 'regular)');
      
      set({ questions: shuffled });
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
