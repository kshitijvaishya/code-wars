import { Judge0Provider } from './judge0.provider';
import type { IJudgeProvider } from './types';

// Singleton judge provider — swap Judge0Provider for another implementation here
let provider: IJudgeProvider | null = null;

export function getJudgeProvider(): IJudgeProvider {
  if (!provider) {
    provider = new Judge0Provider();
  }
  return provider;
}

export type { IJudgeProvider, JudgeSubmissionRequest, JudgeResult, JudgeRunRequest, JudgeRunResult } from './types';
