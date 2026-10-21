import { z } from 'zod';
export declare const createProblemSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    description: z.ZodOptional<z.ZodString>;
    inputFormat: z.ZodOptional<z.ZodString>;
    outputFormat: z.ZodOptional<z.ZodString>;
    constraints: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    sampleTestCases: z.ZodDefault<z.ZodArray<z.ZodObject<{
        input: z.ZodString;
        expectedOutput: z.ZodString;
        explanation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        input: string;
        expectedOutput: string;
        explanation?: string | undefined;
    }, {
        input: string;
        expectedOutput: string;
        explanation?: string | undefined;
    }>, "many">>;
    hiddenTestCases: z.ZodDefault<z.ZodArray<z.ZodObject<{
        input: z.ZodString;
        expectedOutput: z.ZodString;
        score: z.ZodNumber;
        timeLimitMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        input: string;
        expectedOutput: string;
        score: number;
        timeLimitMs?: number | undefined;
    }, {
        input: string;
        expectedOutput: string;
        score: number;
        timeLimitMs?: number | undefined;
    }>, "many">>;
    timeLimitMs: z.ZodOptional<z.ZodNumber>;
    memoryLimitMb: z.ZodOptional<z.ZodNumber>;
    supportedLanguages: z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>;
    outputSizeLimitKb: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["draft", "published", "archived"]>>;
    isPublished: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    tags: string[];
    sampleTestCases: {
        input: string;
        expectedOutput: string;
        explanation?: string | undefined;
    }[];
    hiddenTestCases: {
        input: string;
        expectedOutput: string;
        score: number;
        timeLimitMs?: number | undefined;
    }[];
    supportedLanguages: number[];
    timeLimitMs?: number | undefined;
    title?: string | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    description?: string | undefined;
    inputFormat?: string | undefined;
    outputFormat?: string | undefined;
    constraints?: string | undefined;
    notes?: string | undefined;
    memoryLimitMb?: number | undefined;
    outputSizeLimitKb?: number | undefined;
    status?: "draft" | "published" | "archived" | undefined;
    isPublished?: boolean | undefined;
}, {
    timeLimitMs?: number | undefined;
    title?: string | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    tags?: string[] | undefined;
    description?: string | undefined;
    inputFormat?: string | undefined;
    outputFormat?: string | undefined;
    constraints?: string | undefined;
    notes?: string | undefined;
    sampleTestCases?: {
        input: string;
        expectedOutput: string;
        explanation?: string | undefined;
    }[] | undefined;
    hiddenTestCases?: {
        input: string;
        expectedOutput: string;
        score: number;
        timeLimitMs?: number | undefined;
    }[] | undefined;
    memoryLimitMb?: number | undefined;
    supportedLanguages?: number[] | undefined;
    outputSizeLimitKb?: number | undefined;
    status?: "draft" | "published" | "archived" | undefined;
    isPublished?: boolean | undefined;
}>;
export declare const updateProblemSchema: z.ZodObject<z.objectUtil.extendShape<{
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    difficulty: z.ZodOptional<z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    inputFormat: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    outputFormat: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    constraints: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sampleTestCases: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        input: z.ZodString;
        expectedOutput: z.ZodString;
        explanation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        input: string;
        expectedOutput: string;
        explanation?: string | undefined;
    }, {
        input: string;
        expectedOutput: string;
        explanation?: string | undefined;
    }>, "many">>>;
    hiddenTestCases: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        input: z.ZodString;
        expectedOutput: z.ZodString;
        score: z.ZodNumber;
        timeLimitMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        input: string;
        expectedOutput: string;
        score: number;
        timeLimitMs?: number | undefined;
    }, {
        input: string;
        expectedOutput: string;
        score: number;
        timeLimitMs?: number | undefined;
    }>, "many">>>;
    timeLimitMs: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    memoryLimitMb: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    supportedLanguages: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>>;
    outputSizeLimitKb: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["draft", "published", "archived"]>>>;
    isPublished: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, {
    status: z.ZodOptional<z.ZodEnum<["draft", "published", "archived"]>>;
    isPublished: z.ZodOptional<z.ZodBoolean>;
}>, "strip", z.ZodTypeAny, {
    timeLimitMs?: number | undefined;
    title?: string | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    tags?: string[] | undefined;
    description?: string | undefined;
    inputFormat?: string | undefined;
    outputFormat?: string | undefined;
    constraints?: string | undefined;
    notes?: string | undefined;
    sampleTestCases?: {
        input: string;
        expectedOutput: string;
        explanation?: string | undefined;
    }[] | undefined;
    hiddenTestCases?: {
        input: string;
        expectedOutput: string;
        score: number;
        timeLimitMs?: number | undefined;
    }[] | undefined;
    memoryLimitMb?: number | undefined;
    supportedLanguages?: number[] | undefined;
    outputSizeLimitKb?: number | undefined;
    status?: "draft" | "published" | "archived" | undefined;
    isPublished?: boolean | undefined;
}, {
    timeLimitMs?: number | undefined;
    title?: string | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    tags?: string[] | undefined;
    description?: string | undefined;
    inputFormat?: string | undefined;
    outputFormat?: string | undefined;
    constraints?: string | undefined;
    notes?: string | undefined;
    sampleTestCases?: {
        input: string;
        expectedOutput: string;
        explanation?: string | undefined;
    }[] | undefined;
    hiddenTestCases?: {
        input: string;
        expectedOutput: string;
        score: number;
        timeLimitMs?: number | undefined;
    }[] | undefined;
    memoryLimitMb?: number | undefined;
    supportedLanguages?: number[] | undefined;
    outputSizeLimitKb?: number | undefined;
    status?: "draft" | "published" | "archived" | undefined;
    isPublished?: boolean | undefined;
}>;
export declare function validateProblemPublication(problem: {
    title?: string;
    description?: string;
    inputFormat?: string;
    outputFormat?: string;
    constraints?: string;
    sampleTestCases?: Array<{
        input: string;
        expectedOutput: string;
    }>;
    hiddenTestCases?: Array<{
        input: string;
        expectedOutput: string;
        score: number;
    }>;
    supportedLanguages?: number[];
    timeLimitMs?: number;
    memoryLimitMb?: number;
}): string[];
export declare function validateProblemCreation(problem: Parameters<typeof validateProblemPublication>[0] & {
    status?: string;
}): string[];
