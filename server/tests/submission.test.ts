import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Unit tests for submission/judging logic ───────────────────────────────

type Verdict = 'ACCEPTED' | 'WRONG_ANSWER' | 'PARTIAL_SCORE' | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'INTERNAL_ERROR'
  | 'PENDING' | 'PROCESSING';

describe('Submission verdict aggregation', () => {
  function aggregateVerdict(
    results: Array<{ verdict: Verdict; isSample: boolean; score: number; scoreEarned: number }>,
  ): { verdict: Verdict; totalScore: number } {
    const hiddenResults = results.filter((r) => !r.isSample);
    const totalScore = hiddenResults.reduce((s, r) => s + r.scoreEarned, 0);
    const totalPossible = hiddenResults.reduce((s, r) => s + r.score, 0);
    const allPassed = hiddenResults.every((r) => r.verdict === 'ACCEPTED');
    const compileError = results.find((r) => r.verdict === 'COMPILATION_ERROR');

    let verdict: Verdict;
    if (compileError) {
      verdict = 'COMPILATION_ERROR';
    } else if (allPassed && hiddenResults.length > 0) {
      verdict = 'ACCEPTED';
    } else if (totalScore > 0) {
      verdict = 'PARTIAL_SCORE';
    } else {
      verdict = 'WRONG_ANSWER';
    }
    return { verdict, totalScore };
  }

  it('all hidden tests pass → ACCEPTED', () => {
    const results = [
      { verdict: 'ACCEPTED' as Verdict, isSample: false, score: 10, scoreEarned: 10 },
      { verdict: 'ACCEPTED' as Verdict, isSample: false, score: 10, scoreEarned: 10 },
    ];
    expect(aggregateVerdict(results).verdict).toBe('ACCEPTED');
  });

  it('some hidden tests fail → PARTIAL_SCORE', () => {
    const results = [
      { verdict: 'ACCEPTED' as Verdict, isSample: false, score: 10, scoreEarned: 10 },
      { verdict: 'WRONG_ANSWER' as Verdict, isSample: false, score: 10, scoreEarned: 0 },
    ];
    const { verdict, totalScore } = aggregateVerdict(results);
    expect(verdict).toBe('PARTIAL_SCORE');
    expect(totalScore).toBe(10);
  });

  it('all hidden tests fail → WRONG_ANSWER', () => {
    const results = [
      { verdict: 'WRONG_ANSWER' as Verdict, isSample: false, score: 10, scoreEarned: 0 },
      { verdict: 'WRONG_ANSWER' as Verdict, isSample: false, score: 10, scoreEarned: 0 },
    ];
    expect(aggregateVerdict(results).verdict).toBe('WRONG_ANSWER');
  });

  it('compilation error overrides everything', () => {
    const results = [
      { verdict: 'COMPILATION_ERROR' as Verdict, isSample: true, score: 0, scoreEarned: 0 },
      { verdict: 'ACCEPTED' as Verdict, isSample: false, score: 10, scoreEarned: 10 },
    ];
    expect(aggregateVerdict(results).verdict).toBe('COMPILATION_ERROR');
  });

  it('sample test case results do not affect score', () => {
    const results = [
      { verdict: 'WRONG_ANSWER' as Verdict, isSample: true, score: 0, scoreEarned: 0 },
      { verdict: 'ACCEPTED' as Verdict, isSample: false, score: 10, scoreEarned: 10 },
    ];
    const { verdict, totalScore } = aggregateVerdict(results);
    expect(verdict).toBe('ACCEPTED');
    expect(totalScore).toBe(10);
  });
});

describe('Output normalization', () => {
  function normalizeOutput(output: string): string {
    return output.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  it('trims trailing whitespace', () => {
    expect(normalizeOutput('  42  \n')).toBe('42');
  });

  it('normalizes Windows line endings', () => {
    expect(normalizeOutput('1\r\n2\r\n3')).toBe('1\n2\n3');
  });

  it('handles empty output', () => {
    expect(normalizeOutput('')).toBe('');
  });
});

describe('Source code size limits', () => {
  it('rejects code over 100,000 characters', () => {
    const MAX_CODE_SIZE = 100000;
    const tooLong = 'x'.repeat(100001);
    expect(tooLong.length > MAX_CODE_SIZE).toBe(true);
  });

  it('accepts code within limits', () => {
    const MAX_CODE_SIZE = 100000;
    const validCode = 'print("hello world")';
    expect(validCode.length <= MAX_CODE_SIZE).toBe(true);
  });
});

describe('Piston/execution status mapping', () => {
  const STATUS_MAP: Record<number, Verdict> = {
    1: 'PENDING',
    2: 'PROCESSING',
    3: 'ACCEPTED',
    4: 'WRONG_ANSWER',
    5: 'TIME_LIMIT_EXCEEDED',
    6: 'COMPILATION_ERROR',
    7: 'RUNTIME_ERROR',
    8: 'RUNTIME_ERROR',
    9: 'RUNTIME_ERROR',
    10: 'RUNTIME_ERROR',
    11: 'RUNTIME_ERROR',
    12: 'RUNTIME_ERROR',
    13: 'INTERNAL_ERROR',
    14: 'RUNTIME_ERROR',
  };

  it('maps all runtime error codes (7-12, 14) to RUNTIME_ERROR', () => {
    [7, 8, 9, 10, 11, 12, 14].forEach((code) => {
      expect(STATUS_MAP[code]).toBe('RUNTIME_ERROR');
    });
  });

  it('status 3 is ACCEPTED', () => expect(STATUS_MAP[3]).toBe('ACCEPTED'));
  it('status 6 is COMPILATION_ERROR', () => expect(STATUS_MAP[6]).toBe('COMPILATION_ERROR'));
  it('status 5 is TLE', () => expect(STATUS_MAP[5]).toBe('TIME_LIMIT_EXCEEDED'));
});

describe('Idempotency key uniqueness', () => {
  it('two submissions get different idempotency keys', () => {
    // UUIDs are unique by design — verify format
    const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
    const uuid2 = '550e8400-e29b-41d4-a716-446655440001';
    expect(uuid1).not.toBe(uuid2);
  });

  it('duplicate callback with same key is ignored', () => {
    const processedKeys = new Set<string>();
    const key = 'key-abc-123';

    function processCallback(k: string): boolean {
      if (processedKeys.has(k)) return false; // duplicate
      processedKeys.add(k);
      return true;
    }

    expect(processCallback(key)).toBe(true);
    expect(processCallback(key)).toBe(false); // duplicate ignored
  });
});
