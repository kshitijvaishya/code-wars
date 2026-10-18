import mongoose, { Document, Schema } from 'mongoose';

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
  hiddenTestCases: IHiddenTestCase[]; // NEVER exposed via public API
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

const SampleTestCaseSchema = new Schema<ISampleTestCase>({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  explanation: { type: String },
});

const HiddenTestCaseSchema = new Schema<IHiddenTestCase>({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  score: { type: Number, required: true, default: 1 },
  timeLimitMs: { type: Number },
});

const ProblemSchema = new Schema<IProblem>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    tags: { type: [String], default: [], index: true },
    description: { type: String, required: true },
    inputFormat: { type: String, required: true },
    outputFormat: { type: String, required: true },
    constraints: { type: String, required: true },
    notes: { type: String },
    sampleTestCases: { type: [SampleTestCaseSchema], default: [] },
    hiddenTestCases: { type: [HiddenTestCaseSchema], default: [], select: false }, // excluded by default
    timeLimitMs: { type: Number, default: 2000 },
    memoryLimitMb: { type: Number, default: 256 },
    supportedLanguages: { type: [Number], default: [71, 62, 63, 74, 60, 91] }, // Python3, Java, JS, TypeScript, Ruby, Node
    outputSizeLimitKb: { type: Number, default: 1024 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    isPublished: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

ProblemSchema.index({ difficulty: 1, status: 1 });
ProblemSchema.index({ tags: 1, status: 1 });

ProblemSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret.hiddenTestCases; // extra safety
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const Problem = mongoose.model<IProblem>('Problem', ProblemSchema);
