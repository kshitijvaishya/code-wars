import type { IJudgeProvider, JudgeSubmissionRequest, JudgeResult, JudgeRunRequest, JudgeRunResult } from './types';
export declare class PistonProvider implements IJudgeProvider {
    private readonly client;
    private runtimeCache;
    private cacheTimestamp;
    private readonly CACHE_TTL_MS;
    constructor();
    /**
     * Fetch available runtimes from Piston
     */
    private getRuntimes;
    /**
     * Get Piston runtime info from Judge0 language ID
     */
    private getLanguageInfo;
    /**
     * Execute code with Piston
     */
    private executeCode;
    submitBatch(requests: JudgeSubmissionRequest[]): Promise<string[]>;
    private resultStore;
    private storeResult;
    private storeErrorResult;
    getResults(tokens: string[]): Promise<JudgeResult[]>;
    run(request: JudgeRunRequest): Promise<JudgeRunResult>;
    getSupportedLanguages(): Promise<Array<{
        id: number;
        name: string;
    }>>;
}
