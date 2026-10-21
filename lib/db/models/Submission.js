import mongoose, { Schema } from 'mongoose';
const TestCaseResultSchema = new Schema({
    testCaseId: { type: Schema.Types.ObjectId, required: true },
    verdict: { type: String, required: true },
    timeTakenMs: { type: Number, default: null },
    memoryUsedKb: { type: Number, default: null },
    isSample: { type: Boolean, default: false },
    scoreEarned: { type: Number, default: 0 },
    stdout: { type: String, select: false }, // only for sample, not returned by default
    stderr: { type: String, select: false },
});
const SubmissionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    battleId: { type: Schema.Types.ObjectId, ref: 'Battle', default: null, index: true },
    languageId: { type: Number, required: true },
    sourceCode: { type: String, required: true, maxlength: 100000 },
    verdict: {
        type: String,
        enum: ['ACCEPTED', 'WRONG_ANSWER', 'PARTIAL_SCORE', 'COMPILATION_ERROR', 'RUNTIME_ERROR',
            'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'INTERNAL_ERROR', 'PENDING', 'PROCESSING'],
        default: 'PENDING',
    },
    score: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    timeTakenMs: { type: Number, default: null },
    memoryUsedKb: { type: Number, default: null },
    compilationOutput: { type: String, default: null },
    testCaseResults: { type: [TestCaseResultSchema], default: [] },
    executionTokens: { type: [String], default: [] }, // Execution engine tokens
    submittedAt: { type: Date, default: Date.now },
    judgedAt: { type: Date, default: null },
    idempotencyKey: { type: String, required: true, unique: true },
}, { timestamps: false });
SubmissionSchema.index({ userId: 1, problemId: 1, submittedAt: -1 });
SubmissionSchema.index({ battleId: 1, userId: 1 });
SubmissionSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v;
        delete ret.sourceCode; // don't expose in list views — use dedicated endpoint
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
    },
});
export const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
