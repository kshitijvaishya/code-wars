export type SubmissionVerdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'PARTIAL_SCORE'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'PENDING'
  | 'PROCESSING';

export interface TestCaseResult {
  testCaseId: string;
  verdict: SubmissionVerdict;
  timeTakenMs: number | null;
  memoryUsedKb: number | null;
  isSample: boolean;
  // stdout/stderr only for sample cases
  stdout?: string;
  stderr?: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  battleId: string | null;
  languageId: number;
  verdict: SubmissionVerdict;
  score: number;
  totalScore: number;
  timeTakenMs: number | null;
  memoryUsedKb: number | null;
  testCaseResults: TestCaseResult[];
  submittedAt: string;
  judgedAt: string | null;
}

export interface RunResult {
  testCaseId: string;
  stdin: string;
  stdout: string;
  stderr: string;
  expectedOutput: string | null;
  verdict: SubmissionVerdict;
  timeTakenMs: number | null;
  memoryUsedKb: number | null;
  isSample: boolean;
}
