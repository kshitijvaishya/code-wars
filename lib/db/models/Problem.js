import mongoose, { Schema } from 'mongoose';
const SampleTestCaseSchema = new Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    explanation: { type: String },
});
const HiddenTestCaseSchema = new Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    score: { type: Number, required: true, default: 1 },
    timeLimitMs: { type: Number },
});
const ProblemSchema = new Schema({
    title: { type: String, required: true, trim: true, maxlength: 200, default: 'Untitled problem' },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, default: 'medium' },
    tags: { type: [String], default: [], index: true },
    description: { type: String, required: true, default: '' },
    inputFormat: { type: String, required: true, default: '' },
    outputFormat: { type: String, required: true, default: '' },
    constraints: { type: String, required: true, default: '' },
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
}, { timestamps: true });
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
export const Problem = mongoose.models.Problem || mongoose.model('Problem', ProblemSchema);
