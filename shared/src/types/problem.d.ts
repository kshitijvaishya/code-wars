export type Difficulty = 'easy' | 'medium' | 'hard';
export interface SampleTestCase {
    id: string;
    input: string;
    expectedOutput: string;
    explanation?: string;
}
export interface PublicProblem {
    id: string;
    title: string;
    slug: string;
    difficulty: Difficulty;
    tags: string[];
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    sampleTestCases: SampleTestCase[];
    timeLimitMs: number;
    memoryLimitMb: number;
    supportedLanguages: number[];
    createdAt: string;
}
export interface AdminProblem extends PublicProblem {
    isPublished: boolean;
    hiddenTestCaseCount: number;
    createdBy: string;
}
