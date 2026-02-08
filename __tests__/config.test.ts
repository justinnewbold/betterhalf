import {
  AUTH_INIT_TIMEOUT_MS,
  INVITE_CODE_LENGTH,
  INVITE_CODE_CHARS,
  DAILY_SYNC_QUESTIONS,
  DATE_NIGHT_QUESTIONS,
  MAX_CUSTOM_QUESTION_LENGTH,
  MAX_CUSTOM_OPTION_LENGTH,
  MIN_CUSTOM_OPTIONS,
} from '../constants/config';

describe('Config constants', () => {
  it('has valid auth timeout', () => {
    expect(AUTH_INIT_TIMEOUT_MS).toBeGreaterThan(0);
    expect(AUTH_INIT_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });

  it('has valid invite code settings', () => {
    expect(INVITE_CODE_LENGTH).toBeGreaterThan(0);
    expect(INVITE_CODE_CHARS.length).toBeGreaterThan(20);
    // No ambiguous characters
    expect(INVITE_CODE_CHARS).not.toContain('0');
    expect(INVITE_CODE_CHARS).not.toContain('O');
    expect(INVITE_CODE_CHARS).not.toContain('I');
    expect(INVITE_CODE_CHARS).not.toContain('1');
  });

  it('has valid game question counts', () => {
    expect(DAILY_SYNC_QUESTIONS).toBe(5);
    expect(DATE_NIGHT_QUESTIONS).toBe(10);
    expect(DATE_NIGHT_QUESTIONS).toBeGreaterThan(DAILY_SYNC_QUESTIONS);
  });

  it('has valid custom question limits', () => {
    expect(MAX_CUSTOM_QUESTION_LENGTH).toBeGreaterThan(0);
    expect(MAX_CUSTOM_OPTION_LENGTH).toBeGreaterThan(0);
    expect(MIN_CUSTOM_OPTIONS).toBeGreaterThanOrEqual(2);
  });
});
