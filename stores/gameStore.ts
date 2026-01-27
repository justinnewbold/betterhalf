import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Question {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
}

interface GameState {
  currentSession: {
    id: string;
    mode: string;
    questions: Question[];
    currentIndex: number;
  } | null;
  myAnswers: Record<string, number>;
  partnerAnswers: Record<string, number>;
  isWaitingForPartner: boolean;
  results: {
    totalQuestions: number;
    matchedCount: number;
    score: number;
    details: Array<{
      question: Question;
      myAnswer: number;
      partnerAnswer: number;
      isMatch: boolean;
    }>;
  } | null;

  // Actions
  startDailySync: (coupleId: string) => Promise<void>;
  startDateNight: (coupleId: string) => Promise<void>;
  submitAnswer: (questionId: string, optionIndex: number, userId: string) => Promise<void>;
  checkPartnerAnswer: (questionId: string) => Promise<boolean>;
  calculateResults: () => void;
  resetGame: () => void;
  subscribeToAnswers: (sessionId: string, partnerId: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentSession: null,
  myAnswers: {},
  partnerAnswers: {},
  isWaitingForPartner: false,
  results: null,

  startDailySync: async (coupleId) => {
    set({ isWaitingForPartner: false, myAnswers: {}, partnerAnswers: {}, results: null });
    
    // Get a random question for today
    const today = new Date().toISOString().split('T')[0];
    
    // Check if daily question exists
    let { data: dailyQ } = await supabase
      .from('daily_questions')
      .select('question_id')
      .eq('date', today)
      .single();

    let questionId: string;
    
    if (!dailyQ) {
      // Pick a random question
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('is_active', true)
        .limit(100);
      
      if (!questions?.length) {
        console.error('No questions found');
        return;
      }
      
      questionId = questions[Math.floor(Math.random() * questions.length)].id;
      
      // Save daily question
      await supabase.from('daily_questions').insert({ date: today, question_id: questionId });
    } else {
      questionId = dailyQ.question_id;
    }

    // Fetch the full question
    const { data: question } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (!question) return;

    // Create game session
    const { data: session } = await supabase
      .from('game_sessions')
      .insert({
        couple_id: coupleId,
        mode: 'daily_sync',
        total_questions: 1
      })
      .select()
      .single();

    if (!session) return;

    set({
      currentSession: {
        id: session.id,
        mode: 'daily_sync',
        questions: [{
          id: question.id,
          category: question.category,
          difficulty: question.difficulty,
          question: question.question,
          options: question.options
        }],
        currentIndex: 0
      }
    });
  },

  startDateNight: async (coupleId) => {
    set({ isWaitingForPartner: false, myAnswers: {}, partnerAnswers: {}, results: null });
    
    // Get 10 random questions across categories
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .limit(50);

    if (!questions?.length) return;

    // Shuffle and pick 10
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 10);

    // Create game session
    const { data: session } = await supabase
      .from('game_sessions')
      .insert({
        couple_id: coupleId,
        mode: 'date_night',
        total_questions: 10
      })
      .select()
      .single();

    if (!session) return;

    set({
      currentSession: {
        id: session.id,
        mode: 'date_night',
        questions: shuffled.map(q => ({
          id: q.id,
          category: q.category,
          difficulty: q.difficulty,
          question: q.question,
          options: q.options
        })),
        currentIndex: 0
      }
    });
  },

  submitAnswer: async (questionId, optionIndex, userId) => {
    const { currentSession } = get();
    if (!currentSession) return;

    // Save answer to database
    await supabase.from('answers').insert({
      session_id: currentSession.id,
      question_id: questionId,
      user_id: userId,
      selected_option: optionIndex
    });

    // Update local state
    set(state => ({
      myAnswers: { ...state.myAnswers, [questionId]: optionIndex },
      isWaitingForPartner: true
    }));
  },

  checkPartnerAnswer: async (questionId) => {
    const { currentSession, partnerAnswers } = get();
    if (!currentSession) return false;

    // Check if we already have partner's answer from subscription
    if (partnerAnswers[questionId] !== undefined) {
      set({ isWaitingForPartner: false });
      return true;
    }

    return false;
  },

  subscribeToAnswers: (sessionId, partnerId) => {
    const channel = supabase
      .channel(`game:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'answers',
        filter: `session_id=eq.${sessionId}`
      }, (payload: any) => {
        if (payload.new.user_id === partnerId) {
          set(state => ({
            partnerAnswers: {
              ...state.partnerAnswers,
              [payload.new.question_id]: payload.new.selected_option
            },
            isWaitingForPartner: false
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  calculateResults: () => {
    const { currentSession, myAnswers, partnerAnswers } = get();
    if (!currentSession) return;

    let matchedCount = 0;
    const details = currentSession.questions.map(question => {
      const myAnswer = myAnswers[question.id];
      const partnerAnswer = partnerAnswers[question.id];
      const isMatch = myAnswer === partnerAnswer;
      if (isMatch) matchedCount++;
      
      return {
        question,
        myAnswer,
        partnerAnswer,
        isMatch
      };
    });

    const score = matchedCount * 10;

    set({
      results: {
        totalQuestions: currentSession.questions.length,
        matchedCount,
        score,
        details
      }
    });

    // Update session in database
    supabase.from('game_sessions').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      matched_count: matchedCount,
      score
    }).eq('id', currentSession.id);
  },

  resetGame: () => {
    set({
      currentSession: null,
      myAnswers: {},
      partnerAnswers: {},
      isWaitingForPartner: false,
      results: null
    });
  }
}));
