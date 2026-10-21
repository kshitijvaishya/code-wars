import mongoose, { Schema } from 'mongoose';
const TestCaseSchema = new Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    weight: { type: Number, default: 1 },
}, { _id: false });
const QuestionSchema = new Schema({
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
}, { timestamps: true });
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
export const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
