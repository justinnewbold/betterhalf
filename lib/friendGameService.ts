import { getSupabase, TABLES, QuestionCategory } from './supabase';
import type { FriendGameWithQuestion, FriendWithUser } from './supabase';
import { DEFAULT_FRIEND_DAILY_LIMIT, DEFAULT_FRIEND_CATEGORIES, FRIEND_GAME_EXPIRY_HOURS } from '../constants/config';

/**
 * Service layer for Friend Game functionality
 * Handles all game-related database operations
 */

/**
 * Get or create today's games for a friendship
 * Creates up to daily_limit games if none exist
 */
export async function getOrCreateTodaysGames(
  friendship: FriendWithUser,
  currentUserId: string
): Promise<{ games: FriendGameWithQuestion[]; error: unknown }> {
  const supabase = getSupabase();
  if (!supabase) return { games: [], error: 'No database connection' };

  const today = new Date().toISOString().split('T')[0];
  const isInitiator = friendship.user_id === currentUserId;

  try {
    // Check for existing games today
    const { data: existingGames, error: fetchError } = await supabase
      .from(TABLES.friend_games)
      .select(`
        *,
        question:betterhalf_questions(id, category, question, options)
      `)
      .eq('friendship_id', friendship.id)
      .eq('game_date', today)
      .order('question_number', { ascending: true });

    if (fetchError) {
      console.error('[FriendGameService] Fetch error:', fetchError);
      return { games: [], error: fetchError };
    }

    // If games exist, return them
    if (existingGames && existingGames.length > 0) {
      return {
        games: existingGames.map(formatGame),
        error: null,
      };
    }

    // No games exist - create new ones
    const { games: newGames, error: createError } = await createDailyGames(friendship);
    return { games: newGames, error: createError };
  } catch (err) {
    console.error('[FriendGameService] Unexpected error:', err);
    return { games: [], error: err };
  }
}

/**
 * Create a full day's worth of games for a friendship
 */
async function createDailyGames(
  friendship: FriendWithUser
): Promise<{ games: FriendGameWithQuestion[]; error: unknown }> {
  const supabase = getSupabase();
  if (!supabase) return { games: [], error: 'No database connection' };

  const today = new Date().toISOString().split('T')[0];
  const dailyLimit = friendship.daily_limit || DEFAULT_FRIEND_DAILY_LIMIT;
  const categories = friendship.preferred_categories || [...DEFAULT_FRIEND_CATEGORIES];

  // Determine audience based on relationship type
  const isFamily = ['family', 'sibling', 'parent', 'child', 'cousin'].includes(friendship.relationship_type);
  const audienceColumn = isFamily ? 'for_family' : 'for_friends';

  try {
    // Get questions that match the friendship's categories and audience
    const { data: questions, error: questionError } = await supabase
      .from(TABLES.questions)
      .select('id, category, question, options')
      .in('category', categories)
      .eq(audienceColumn, true)
      .eq('is_active', true);

    if (questionError || !questions || questions.length === 0) {
      console.error('[FriendGameService] No questions available:', questionError);
      return { games: [], error: questionError || 'No questions available' };
    }

    // Shuffle and select questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(dailyLimit, shuffled.length));

    // Create game entries
    const gamesToInsert = selectedQuestions.map((q, index) => ({
      friendship_id: friendship.id,
      question_id: q.id,
      game_date: today,
      question_number: index + 1,
      status: 'waiting_both',
      expires_at: new Date(Date.now() + FRIEND_GAME_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
    }));

    const { data: insertedGames, error: insertError } = await supabase
      .from(TABLES.friend_games)
      .insert(gamesToInsert)
      .select(`
        *,
        question:betterhalf_questions(id, category, question, options)
      `);

    if (insertError) {
      console.error('[FriendGameService] Insert error:', insertError);
      return { games: [], error: insertError };
    }

    console.log('[FriendGameService] Created', insertedGames?.length, 'games for friendship', friendship.id);
    
    return {
      games: (insertedGames || []).map(formatGame),
      error: null,
    };
  } catch (err) {
    console.error('[FriendGameService] Create games error:', err);
    return { games: [], error: err };
  }
}

/**
 * Get the next unanswered question for a user in a friendship
 */
export async function getNextQuestion(
  friendshipId: string,
  currentUserId: string,
  friendship: FriendWithUser
): Promise<{ game: FriendGameWithQuestion | null; error: unknown }> {
  const supabase = getSupabase();
  if (!supabase) return { game: null, error: 'No database connection' };

  const today = new Date().toISOString().split('T')[0];
  const isInitiator = friendship.user_id === currentUserId;

  try {
    // Find the next question this user hasn't answered
    const { data: games, error } = await supabase
      .from(TABLES.friend_games)
      .select(`
        *,
        question:betterhalf_questions(id, category, question, options)
      `)
      .eq('friendship_id', friendshipId)
      .eq('game_date', today)
      .order('question_number', { ascending: true });

    if (error) {
      return { game: null, error };
    }

    // Find first unanswered question
    const nextGame = games?.find(g => {
      if (isInitiator) {
        return g.initiator_answer === null;
      }
      return g.friend_answer === null;
    });

    return {
      game: nextGame ? formatGame(nextGame) : null,
      error: null,
    };
  } catch (err) {
    return { game: null, error: err };
  }
}

/**
 * Submit an answer for a game
 */
export async function submitAnswer(
  gameId: string,
  answer: number,
  currentUserId: string,
  friendship: FriendWithUser
): Promise<{ isMatch: boolean | null; error: unknown }> {
  const supabase = getSupabase();
  if (!supabase) return { isMatch: null, error: 'No database connection' };

  const isInitiator = friendship.user_id === currentUserId;

  try {
    // Get current game state
    const { data: game, error: fetchError } = await supabase
      .from(TABLES.friend_games)
      .select('*')
      .eq('id', gameId)
      .single();

    if (fetchError || !game) {
      return { isMatch: null, error: fetchError || 'Game not found' };
    }

    // Check if already answered
    if (isInitiator && game.initiator_answer !== null) {
      return { isMatch: null, error: 'You have already answered this question' };
    }
    if (!isInitiator && game.friend_answer !== null) {
      return { isMatch: null, error: 'You have already answered this question' };
    }

    const updates: Record<string, unknown> = {
      [isInitiator ? 'initiator_answer' : 'friend_answer']: answer,
      [isInitiator ? 'initiator_answered_at' : 'friend_answered_at']: new Date().toISOString(),
    };

    // Determine new status and if it's a match
    const otherAnswer = isInitiator ? game.friend_answer : game.initiator_answer;
    const otherAnswered = otherAnswer !== null;

    if (otherAnswered) {
      // Both have now answered
      updates.status = 'completed';
      updates.is_match = answer === otherAnswer;
      updates.completed_at = new Date().toISOString();
    } else {
      // Waiting for other person
      updates.status = isInitiator ? 'waiting_friend' : 'waiting_initiator';
    }

    const { error: updateError } = await supabase
      .from(TABLES.friend_games)
      .update(updates)
      .eq('id', gameId);

    if (updateError) {
      console.error('[FriendGameService] Submit answer error:', updateError);
      return { isMatch: null, error: updateError };
    }

    return {
      isMatch: otherAnswered ? (answer === otherAnswer) : null,
      error: null,
    };
  } catch (err) {
    return { isMatch: null, error: err };
  }
}

/**
 * Get daily progress for a friendship
 */
export async function getDailyProgress(
  friendshipId: string,
  currentUserId: string,
  friendship: FriendWithUser
): Promise<{
  totalQuestions: number;
  answeredByUser: number;
  answeredByFriend: number;
  completed: number;
  matches: number;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { totalQuestions: 0, answeredByUser: 0, answeredByFriend: 0, completed: 0, matches: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const isInitiator = friendship.user_id === currentUserId;

  const { data: games } = await supabase
    .from(TABLES.friend_games)
    .select('*')
    .eq('friendship_id', friendshipId)
    .eq('game_date', today);

  if (!games) {
    return { totalQuestions: 0, answeredByUser: 0, answeredByFriend: 0, completed: 0, matches: 0 };
  }

  const totalQuestions = games.length;
  const answeredByUser = games.filter(g =>
    isInitiator ? g.initiator_answer !== null : g.friend_answer !== null
  ).length;
  const answeredByFriend = games.filter(g =>
    isInitiator ? g.friend_answer !== null : g.initiator_answer !== null
  ).length;
  const completed = games.filter(g => g.status === 'completed').length;
  const matches = games.filter(g => g.is_match === true).length;

  return { totalQuestions, answeredByUser, answeredByFriend, completed, matches };
}

/**
 * Get game history for a friendship
 */
export async function getGameHistory(
  friendshipId: string,
  limit: number = 50
): Promise<{ games: FriendGameWithQuestion[]; error: unknown }> {
  const supabase = getSupabase();
  if (!supabase) return { games: [], error: 'No database connection' };

  const { data, error } = await supabase
    .from(TABLES.friend_games)
    .select(`
      *,
      question:betterhalf_questions(id, category, question, options)
    `)
    .eq('friendship_id', friendshipId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { games: [], error };
  }

  return {
    games: (data || []).map(formatGame),
    error: null,
  };
}

/**
 * Format raw game data into FriendGameWithQuestion
 */
function formatGame(g: Record<string, any>): FriendGameWithQuestion {
  return {
    id: g.id,
    friendship_id: g.friendship_id,
    question_id: g.question_id,
    game_date: g.game_date,
    question_number: g.question_number,
    status: g.status,
    initiator_answer: g.initiator_answer,
    friend_answer: g.friend_answer,
    is_match: g.is_match,
    initiator_answered_at: g.initiator_answered_at,
    friend_answered_at: g.friend_answered_at,
    created_at: g.created_at,
    completed_at: g.completed_at,
    question: g.question ? {
      id: g.question.id,
      category: g.question.category,
      question: g.question.question,
      options: g.question.options,
    } : undefined,
  };
}
