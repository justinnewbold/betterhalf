import { generateInviteCode } from '../lib/supabase';
import { INVITE_CODE_LENGTH, INVITE_CODE_CHARS } from '../constants/config';

describe('generateInviteCode', () => {
  it('returns a string of correct length', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
  });

  it('only contains valid characters', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode();
      for (const char of code) {
        expect(INVITE_CODE_CHARS).toContain(char);
      }
    }
  });

  it('generates unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateInviteCode());
    }
    // With 8 chars from 30+ alphabet, collisions should be extremely rare
    expect(codes.size).toBeGreaterThanOrEqual(95);
  });
});
