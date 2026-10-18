import { describe, expect, it } from 'vitest';
import { validateProblemPublication } from '../src/utils/problemValidation';

const completeProblem = {
  title: 'Two Sum',
  description: 'Find two indices.',
  inputFormat: 'An array and target.',
  outputFormat: 'Two indices.',
  constraints: '2 <= n',
  sampleTestCases: [{ input: '2 7', expectedOutput: '0 1' }],
  hiddenTestCases: [{ input: '3 3', expectedOutput: '0 1', score: 10 }],
  supportedLanguages: [71],
  timeLimitMs: 1000,
  memoryLimitMb: 128,
};

describe('problem publication validation', () => {
  it('accepts a complete problem', () => {
    expect(validateProblemPublication(completeProblem)).toEqual([]);
  });

  it('rejects incomplete problem content', () => {
    const errors = validateProblemPublication({
      ...completeProblem,
      hiddenTestCases: [],
      description: '',
    });

    expect(errors).toContain('Description is required');
    expect(errors).toContain('At least one hidden test case is required');
  });

  it('rejects hidden cases with non-positive scores', () => {
    const errors = validateProblemPublication({
      ...completeProblem,
      hiddenTestCases: [{ input: 'x', expectedOutput: 'y', score: 0 }],
    });

    expect(errors).toContain('Hidden test case 1 must have input, expected output, and a positive score');
  });
});
