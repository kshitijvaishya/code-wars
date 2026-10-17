import { PistonProvider } from './piston.provider';
import type { IJudgeProvider } from './types';

// Singleton judge provider — using Piston for code execution
let provider: IJudgeProvider | null = null;

export function getJudgeProvider(): IJudgeProvider {
  if (!provider) {
    provider = new PistonProvider();
  }
  return provider;
}

export type { IJudgeProvider, JudgeSubmissionRequest, JudgeResult, JudgeRunRequest, JudgeRunResult } from './types';
