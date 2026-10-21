import mongoose, { Document } from 'mongoose';
export interface ISampleTestCase {
    _id?: mongoose.Types.ObjectId;
    input: string;
    expectedOutput: string;
    explanation?: string;
}
export interface IHiddenTestCase {
    _id?: mongoose.Types.ObjectId;
    input: string;
    expectedOutput: string;
    score: number;
    timeLimitMs?: number;
}
export interface IProblem extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    slug: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    notes?: string;
    sampleTestCases: ISampleTestCase[];
    hiddenTestCases: IHiddenTestCase[];
    timeLimitMs: number;
    memoryLimitMb: number;
    supportedLanguages: number[];
    outputSizeLimitKb?: number;
    status: 'draft' | 'published' | 'archived';
    isPublished: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Problem: mongoose.Model<any, {}, {}, {}, any, any>;
