import { beforeEach, describe, expect, it } from 'vitest';
import { getProblemCodeKey, loadProblemCode, saveProblemCode } from '../utils/codePersistence';

describe('problem code persistence', () => {
  beforeEach(() => localStorage.clear());

  it('keeps code isolated by problem and language', () => {
    saveProblemCode('problem-a', 71, 'python solution');
    saveProblemCode('problem-a', 63, 'javascript solution');
    saveProblemCode('problem-b', 71, 'other python solution');

    expect(getProblemCodeKey('problem-a', 71)).toBe('cw-draft-problem-problem-a-71');
    expect(loadProblemCode('problem-a', 71)).toBe('python solution');
    expect(loadProblemCode('problem-a', 63)).toBe('javascript solution');
    expect(loadProblemCode('problem-b', 71)).toBe('other python solution');
  });
});
