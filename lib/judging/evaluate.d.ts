import type { SubmissionVerdict } from '../db/models/Submission';
export interface EvaluationResult {
    verdict: SubmissionVerdict;
    score: number;
    passedTests: number;
    totalTests: number;
    executionTime?: number;
}
export declare function evaluateSubmission(submissionId: string): Promise<EvaluationResult>;
