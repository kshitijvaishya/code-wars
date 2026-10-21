import mongoose, { Document, Schema } from 'mongoose';

export interface ITestCase {
  input: string;
  output: string;
  weight?: number; // For partial credit
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  roundType: 1 | 2 | 3;
  type: 'mcq' | 'debug' | 'dsa';
  
  title: string;
  statement: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // MCQ specific
  options?: string[];
  correctAnswer?: string; // select: false - never sent to client
  explanation?: string;
  
  // Code specific
  buggyCode?: string;
  sampleTests?: ITestCase[];
  hiddenTests?: ITestCase[]; // select: false
  
  executionLimits?: {
    timeLimit: number; // ms
    memoryLimit: number; // MB
  };
  
  maxPoints: number;
  status: 'draft' | 'published' | 'archived';
  
  createdBy: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  weight: { type: Number, default: 1 },
}, { _id: false });

const QuestionSchema = new Schema<IQuestion>(
  {
    roundType: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['mcq', 'debug', 'dsa'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    statement: { type: String, required: true },
    language: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    
    // MCQ
    options: [String],
    correctAnswer: { type: String, select: false }, // NEVER sent to client
    explanation: String,
    
    // Code
    buggyCode: String,
    sampleTests: [TestCaseSchema],
    hiddenTests: { type: [TestCaseSchema], select: false }, // NEVER sent to client
    
    executionLimits: {
      timeLimit: { type: Number, default: 3000 },
      memoryLimit: { type: Number, default: 256 },
    },
    
    maxPoints: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: Date,
  },
  { timestamps: true }
);

QuestionSchema.index({ roundType: 1, language: 1, status: 1 });

QuestionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret.correctAnswer; // Extra safety
    delete ret.hiddenTests; // Extra safety
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
