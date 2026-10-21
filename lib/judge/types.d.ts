import type { SubmissionVerdict } from '@code-wars/shared';
export interface JudgeSubmissionRequest {
    sourceCode: string;
    languageId: number;
    stdin: string;
    expectedOutput: string;
    timeLimitMs: number;
    memoryLimitMb: number;
    cpuExtraTime?: number;
}
export interface JudgeResult {
    token: string;
    verdict: SubmissionVerdict;
    stdout: string | null;
    stderr: string | null;
    compileOutput: string | null;
    timeTakenMs: number | null;
    memoryUsedKb: number | null;
    status: {
        id: number;
        description: string;
    };
}
export interface JudgeRunRequest {
    sourceCode: string;
    languageId: number;
    stdin: string;
    timeLimitMs: number;
    memoryLimitMb: number;
}
export interface JudgeRunResult {
    stdout: string | null;
    stderr: string | null;
    compileOutput: string | null;
    timeTakenMs: number | null;
    memoryUsedKb: number | null;
    verdict: SubmissionVerdict;
}
export interface IJudgeProvider {
    submitBatch(requests: JudgeSubmissionRequest[]): Promise<string[]>;
    getResults(tokens: string[]): Promise<JudgeResult[]>;
    run(request: JudgeRunRequest): Promise<JudgeRunResult>;
    getSupportedLanguages(): Promise<Array<{
        id: number;
        name: string;
    }>>;
}
