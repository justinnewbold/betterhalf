import { getSupabase, TABLES, QuestionCategory } from './supabase';
import type { Tables } from './supabase';
import {
  QUESTIONS_PER_PAGE,
  QUESTION_LOAD_MULTIPLIER,
} from '../constants/config';

type Question = Tables['questions'];
type CustomQuestion = Tables['custom_questions'];

export interface GameQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  options: string[];
  isCustom?: boolean;
}

/**
 * Shared question-loading service used by both coupleStore/gameStore and friendGameService.
 * Eliminates duplicate fetching logic.
 */

/**
 * Load regular (non-custom) questions.
 * Supports pagination via `page` param (0-indexed).
 */
export async function loadRegularQuestions(options: {
  categories?: QuestionCategory[];
  limit: number;
  page?: number;
  audienceFilter?: { column: 'for_couples' | 'for_friends' | 'for_family'; value: boolean };
}): Promise<{ questions: Question[]; error: any }> {
  const supabase = getSupabase();
  if (!supabase) return { questions: [], error: 'Supabase not configured' };

  const { categories, limit, page = 0, audienceFilter } = options;
  const pageSize = limit * QUESTION_LOAD_MULTIPLIER;
  const offset = page * pageSize;

  let query = supabase
    .from(TABLES.questions)
    .select('*')
    .eq('is_active', true);

  // Filter by categories (exclude 'custom' from regular queries)
  const regularCategories = categories?.filter(c => c !== 'custom') || [];
  if (regularCategories.length > 0) {
    query = query.in('category', regularCategories);
  }

  if (audienceFilter) {
    query = query.eq(audienceFilter.column, audienceFilter.value);
  }

  const { data, error } = await query
    .range(offset, offset + pageSize - 1);

  return { questions: data || [], error };
}

/**
 * Load custom questions for a couple.
 */
export async function loadCustomQuestions(coupleId: string): Promise<{ questions: CustomQuestion[]; error: any }> {
  const supabase = getSupabase();
  if (!supabase) return { questions: [], error: 'Supabase not configured' };

  const { data, error } = await supabase
    .from(TABLES.custom_questions)
    .select('*')
    .eq('couple_id', coupleId)
    .eq('is_active', true);

  return { questions: data || [], error };
}

/**
 * Load and merge regular + custom questions into a unified GameQuestion format.
 * Shuffles and slices to `limit`.
 */
export async function loadGameQuestions(options: {
  coupleId?: string;
  categories?: QuestionCategory[];
  limit: number;
  page?: number;
  audienceFilter?: { column: 'for_couples' | 'for_friends' | 'for_family'; value: boolean };
}): Promise<{ questions: GameQuestion[]; error: any }> {
  const { coupleId, categories, limit, page, audienceFilter } = options;

  // Load regular questions
  const { questions: regularRaw, error: regularError } = await loadRegularQuestions({
    categories,
    limit,
    page,
    audienceFilter,
  });

  if (regularError) {
    console.error('[QuestionService] Load regular questions error:', regularError);
  }

  // Load custom questions if applicable
  let customRaw: CustomQuestion[] = [];
  const includeCustom = !categories || categories.length === 0 || categories.includes('custom');

  if (includeCustom && coupleId) {
    const { questions: customData, error: customError } = await loadCustomQuestions(coupleId);
    if (customError) {
      console.error('[QuestionService] Load custom questions error:', customError);
    } else {
      customRaw = customData;
    }
  }

  // Transform to unified format
  const regular: GameQuestion[] = regularRaw.map(q => ({
    id: q.id,
    category: q.category as QuestionCategory,
    question: q.question,
    options: q.options as string[],
    isCustom: false,
  }));

  const custom: GameQuestion[] = customRaw.map(q => ({
    id: q.id,
    category: 'custom' as QuestionCategory,
    question: q.question,
    options: q.options as string[],
    isCustom: true,
  }));

  // Combine, shuffle, slice
  const all = [...regular, ...custom];
  const shuffled = all.sort(() => Math.random() - 0.5).slice(0, limit);

  console.log(
    '[QuestionService] Loaded',
    shuffled.length,
    'questions (',
    custom.length,
    'custom,',
    regular.length,
    'regular)',
  );

  return { questions: shuffled, error: null };
}
