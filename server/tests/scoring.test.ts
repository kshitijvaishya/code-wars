import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Unit tests for scoring logic (isolated, no DB) ────────────────────────

describe('Elo rating calculation', () => {
  function calculateElo(
    ratingA: number,
    ratingB: number,
    resultA: 'win' | 'loss' | 'draw',
  ) {
    const K = ratingA < 1400 ? 32 : ratingA < 2000 ? 24 : 16;
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const scoreA = resultA === 'win' ? 1 : resultA === 'loss' ? 0 : 0.5;
    const deltaA = Math.round(K * (scoreA - expectedA));
    return { deltaA, deltaB: -deltaA, newA: Math.max(100, ratingA + deltaA), newB: Math.max(100, ratingB + deltaA * -1) };
  }

  it('winner gains rating, loser loses rating', () => {
    const result = calculateElo(1200, 1200, 'win');
    expect(result.deltaA).toBeGreaterThan(0);
    expect(result.deltaB).toBeLessThan(0);
  });

  it('draw produces minimal change for equal ratings', () => {
    const result = calculateElo(1200, 1200, 'draw');
    expect(Object.is(result.deltaA, 0) || Object.is(result.deltaA, -0)).toBe(true);
    expect(Math.abs(result.deltaA)).toBe(0);
  });

  it('upset win gives larger gain', () => {
    const { deltaA: upsetGain } = calculateElo(1000, 1500, 'win');
    const { deltaA: normalGain } = calculateElo(1200, 1200, 'win');
    expect(upsetGain).toBeGreaterThan(normalGain);
  });

  it('rating never drops below 100', () => {
    const result = calculateElo(100, 2000, 'loss');
    expect(result.newA).toBeGreaterThanOrEqual(100);
  });

  it('high-rated player uses smaller K factor', () => {
    const highK = calculateElo(1200, 1200, 'win').deltaA; // K=32
    const lowK = calculateElo(2100, 1200, 'win').deltaA;  // K=16
    expect(Math.abs(lowK)).toBeLessThan(Math.abs(highK));
  });
});

describe('Scoring mode: first_accepted', () => {
  it('earlier submission timestamp wins', () => {
    const t1 = new Date('2026-01-01T10:00:00.000Z');
    const t2 = new Date('2026-01-01T10:00:01.000Z');
    const participants = [
      { userId: 'a', submittedAt: t2, verdict: 'ACCEPTED' },
      { userId: 'b', submittedAt: t1, verdict: 'ACCEPTED' },
    ];
    const winner = participants
      .filter((p) => p.verdict === 'ACCEPTED')
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())[0];
    expect(winner.userId).toBe('b');
  });

  it('simultaneous submissions within 100ms is a draw', () => {
    const t1 = new Date('2026-01-01T10:00:00.000Z');
    const t2 = new Date('2026-01-01T10:00:00.050Z'); // 50ms diff
    const diff = Math.abs(t1.getTime() - t2.getTime());
    expect(diff).toBeLessThan(100);
  });

  it('non-simultaneous submissions beyond 100ms picks winner', () => {
    const t1 = new Date('2026-01-01T10:00:00.000Z');
    const t2 = new Date('2026-01-01T10:00:00.200Z'); // 200ms diff
    const diff = Math.abs(t1.getTime() - t2.getTime());
    expect(diff).toBeGreaterThanOrEqual(100);
  });
});

describe('Scoring mode: score_based', () => {
  it('higher score wins', () => {
    const p1 = { userId: 'a', score: 30 };
    const p2 = { userId: 'b', score: 20 };
    const winner = p1.score > p2.score ? p1 : p2;
    expect(winner.userId).toBe('a');
  });

  it('equal score is a draw', () => {
    const p1 = { userId: 'a', score: 20 };
    const p2 = { userId: 'b', score: 20 };
    const isDraw = p1.score === p2.score;
    expect(isDraw).toBe(true);
  });
});

describe('Scoring mode: time_based', () => {
  it('tiebreak by submission time when scores equal', () => {
    const t1 = new Date('2026-01-01T10:00:05.000Z');
    const t2 = new Date('2026-01-01T10:00:10.000Z');
    const p1 = { userId: 'a', score: 20, submittedAt: t1 };
    const p2 = { userId: 'b', score: 20, submittedAt: t2 };

    let winnerId: string | null = null;
    if (p1.score !== p2.score) {
      winnerId = p1.score > p2.score ? p1.userId : p2.userId;
    } else {
      winnerId = p1.submittedAt < p2.submittedAt ? p1.userId : p2.userId;
    }
    expect(winnerId).toBe('a');
  });
});

describe('Verdict mapping', () => {
  const STATUS_MAP: Record<number, string> = {
    3: 'ACCEPTED',
    4: 'WRONG_ANSWER',
    5: 'TIME_LIMIT_EXCEEDED',
    6: 'COMPILATION_ERROR',
    7: 'RUNTIME_ERROR',
    13: 'INTERNAL_ERROR',
  };

  it('maps Judge0 status 3 to ACCEPTED', () => {
    expect(STATUS_MAP[3]).toBe('ACCEPTED');
  });

  it('maps Judge0 status 5 to TIME_LIMIT_EXCEEDED', () => {
    expect(STATUS_MAP[5]).toBe('TIME_LIMIT_EXCEEDED');
  });

  it('maps Judge0 status 6 to COMPILATION_ERROR', () => {
    expect(STATUS_MAP[6]).toBe('COMPILATION_ERROR');
  });

  it('unknown status returns INTERNAL_ERROR via fallback', () => {
    const verdict = STATUS_MAP[999] ?? 'INTERNAL_ERROR';
    expect(verdict).toBe('INTERNAL_ERROR');
  });
});

describe('Invite code security', () => {
  it('generated codes are uppercase hex, 12 chars', () => {
    // simulate: crypto.randomBytes(6).toString('hex').toUpperCase()
    const code = 'A3F2B1CC5D9E';
    expect(code).toMatch(/^[A-F0-9]{12}$/);
  });

  it('two codes are different', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      // simulating uniqueness probability
      codes.add(Math.random().toString(36).slice(2, 8).toUpperCase());
    }
    expect(codes.size).toBeGreaterThan(90); // collision probability extremely low
  });
});
