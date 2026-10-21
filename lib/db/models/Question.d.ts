import mongoose, { Document } from 'mongoose';
export interface ITestCase {
    input: string;
    output: string;
    weight?: number;
}
export interface IQuestion extends Document {
    _id: mongoose.Types.ObjectId;
    roundType: 1 | 2 | 3;
    type: 'mcq' | 'debug' | 'dsa';
    title: string;
    statement: string;
    language: string;
    difficulty: 'easy' | 'medium' | 'hard';
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    buggyCode?: string;
    sampleTests?: ITestCase[];
    hiddenTests?: ITestCase[];
    executionLimits?: {
        timeLimit: number;
        memoryLimit: number;
    };
    maxPoints: number;
    status: 'draft' | 'published' | 'archived';
    createdBy: mongoose.Types.ObjectId;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Question: mongoose.Model<any, {}, {}, {}, any, any>;
