/**
 * App-wide configuration constants.
 * Centralizes magic numbers and tunable values that were previously
 * scattered across stores, services, and components.
 */

// Auth & initialization
export const AUTH_INIT_TIMEOUT_MS = 5_000;

// Invite codes
export const INVITE_CODE_LENGTH = 8;
export const INVITE_CODE_EXPIRY_DAYS = 7;
// Characters excluding visually ambiguous ones (0/O, 1/I)
export const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Game settings
export const DAILY_SYNC_QUESTIONS = 5;
export const DATE_NIGHT_QUESTIONS = 10;
export const DEFAULT_FRIEND_DAILY_LIMIT = 10;
export const QUESTION_LOAD_MULTIPLIER = 2; // Load N*2 then pick N
export const QUESTIONS_PER_PAGE = 50; // Pagination page size for question loading

// Custom questions
export const MAX_CUSTOM_QUESTION_LENGTH = 200;
export const MAX_CUSTOM_OPTION_LENGTH = 50;
export const MIN_CUSTOM_OPTIONS = 2;
export const MAX_CUSTOM_OPTIONS = 4;

// Friend game expiry
export const FRIEND_GAME_EXPIRY_HOURS = 24;

// Default categories for friends/family
export const DEFAULT_FRIEND_CATEGORIES = ['daily_life', 'fun', 'deep_talks'] as const;
export const DEFAULT_FAMILY_CATEGORIES = ['daily_life', 'fun', 'history'] as const;

// Notifications
export const DEFAULT_DAILY_REMINDER_HOUR = 19;
export const DEFAULT_DAILY_REMINDER_MINUTE = 0;

// Theme
export const THEME_STORAGE_KEY = 'betterhalf-theme-mode';

// Presence / realtime
export const PRESENCE_CHANNEL_PREFIX = 'couple:';

// Disabled gradient colors (for disabled buttons)
export const DISABLED_GRADIENT = ['#555', '#444'] as const;

// App version — starts at v0.01, increments by 0.01 each iteration
// Current: iteration 107 → 107 × 0.01 = 1.07
export const APP_VERSION = 'v1.07';
