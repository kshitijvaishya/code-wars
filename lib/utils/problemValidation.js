import { z } from 'zod';
const sampleTestCaseSchema = z.object({
    input: z.string(),
    expectedOutput: z.string(),
    explanation: z.string().optional(),
});
const hiddenTestCaseSchema = z.object({
    input: z.string(),
    expectedOutput: z.string(),
    score: z.number().positive(),
    timeLimitMs: z.number().int().positive().optional(),
});
const problemFieldsSchema = {
    title: z.string().trim().max(200).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).default([]),
    description: z.string().optional(),
    inputFormat: z.string().optional(),
    outputFormat: z.string().optional(),
    constraints: z.string().optional(),
    notes: z.string().optional(),
    sampleTestCases: z.array(sampleTestCaseSchema).default([]),
    hiddenTestCases: z.array(hiddenTestCaseSchema).default([]),
    timeLimitMs: z.number().int().positive().max(60000).optional(),
    memoryLimitMb: z.number().int().positive().max(4096).optional(),
    supportedLanguages: z.array(z.number().int().positive()).default([71, 62, 63, 74, 60, 91]),
    outputSizeLimitKb: z.number().int().positive().max(10240).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    isPublished: z.boolean().optional(),
};
export const createProblemSchema = z.object(problemFieldsSchema);
export const updateProblemSchema = z.object(problemFieldsSchema).partial().extend({
    status: z.enum(['draft', 'published', 'archived']).optional(),
    isPublished: z.boolean().optional(),
});
export function validateProblemPublication(problem) {
    const errors = [];
    if (!problem.title?.trim())
        errors.push('Title is required');
    if (!problem.description?.trim())
        errors.push('Description is required');
    if (!problem.inputFormat?.trim())
        errors.push('Input format is required');
    if (!problem.outputFormat?.trim())
        errors.push('Output format is required');
    if (!problem.constraints?.trim())
        errors.push('Constraints are required');
    if (!problem.sampleTestCases?.length)
        errors.push('At least one sample test case is required');
    if (!problem.hiddenTestCases?.length)
        errors.push('At least one hidden test case is required');
    if (!problem.supportedLanguages?.length)
        errors.push('At least one supported language is required');
    if (!problem.timeLimitMs || problem.timeLimitMs <= 0)
        errors.push('Time limit must be positive');
    if (!problem.memoryLimitMb || problem.memoryLimitMb <= 0)
        errors.push('Memory limit must be positive');
    for (const [index, testCase] of (problem.sampleTestCases ?? []).entries()) {
        if (!testCase.input.trim() || !testCase.expectedOutput.trim()) {
            errors.push(`Sample test case ${index + 1} must have input and expected output`);
        }
    }
    for (const [index, testCase] of (problem.hiddenTestCases ?? []).entries()) {
        if (!testCase.input.trim() || !testCase.expectedOutput.trim() || testCase.score <= 0) {
            errors.push(`Hidden test case ${index + 1} must have input, expected output, and a positive score`);
        }
    }
    return errors;
}
export function validateProblemCreation(problem) {
    return problem.status === 'published' ? validateProblemPublication(problem) : [];
}
