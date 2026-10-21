import mongoose, { Document } from 'mongoose';
import type { SubmissionVerdict } from '@code-wars/shared';
export interface ITestCaseResult {
    testCaseId: mongoose.Types.ObjectId;
    verdict: SubmissionVerdict;
    timeTakenMs: number | null;
    memoryUsedKb: number | null;
    isSample: boolean;
    scoreEarned: number;
    stdout?: string;
    stderr?: string;
}
export interface ISubmission extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    problemId: mongoose.Types.ObjectId;
    battleId: mongoose.Types.ObjectId | null;
    languageId: number;
    sourceCode: string;
    verdict: SubmissionVerdict;
    score: number;
    totalScore: number;
    timeTakenMs: number | null;
    memoryUsedKb: number | null;
    compilationOutput: string | null;
    testCaseResults: ITestCaseResult[];
    executionTokens: string[];
    submittedAt: Date;
    judgedAt: Date | null;
    idempotencyKey: string;
}
export declare const Submission: mongoose.Model<any, {}, {}, {}, any, any>;
