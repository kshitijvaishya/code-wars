import { describe, expect, it } from 'vitest';
import { getRemainingBattleSeconds } from '../utils/battleTimer';

describe('battle timer synchronization', () => {
  it('derives remaining time from the authoritative end time', () => {
    const now = Date.parse('2026-10-18T12:00:00.000Z');
    expect(getRemainingBattleSeconds('2026-10-18T12:00:05.100Z', now)).toBe(6);
    expect(getRemainingBattleSeconds('2026-10-18T11:59:59.000Z', now)).toBe(0);
    expect(getRemainingBattleSeconds(null, now)).toBe(0);
  });
});
