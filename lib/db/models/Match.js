import mongoose, { Schema } from 'mongoose';
const MatchSchema = new Schema({
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
    stage: {
        type: String,
        enum: ['preliminary', 'final'],
        default: 'preliminary',
    },
    groupLabel: { type: String, required: true }, // Dynamic, not enum
    playerIds: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        required: true,
        validate: {
            validator: (v) => v.length === 2,
            message: 'Match must have exactly 2 players',
        },
    },
    status: {
        type: String,
        enum: ['waiting', 'paired', 'ready', 'countdown', 'in_progress', 'completed', 'cancelled', 'abandoned'],
        default: 'waiting',
        index: true,
    },
    currentRound: { type: Number, default: 0 },
    currentQuestionIndex: { type: Number, default: 0 },
    // Timers
    roundStartedAt: Date,
    questionStartedAt: Date,
    questionDeadlineAt: Date,
    roundDeadlineAt: Date,
    // Scores
    round1Scores: { type: Map, of: Number, default: () => new Map() },
    round2Scores: { type: Map, of: Number, default: () => new Map() },
    preliminaryScores: { type: Map, of: Number, default: () => new Map() },
    finalScores: { type: Map, of: Number },
    winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
    startedAt: Date,
    completedAt: Date,
}, { timestamps: true });
MatchSchema.index({ tournamentId: 1, status: 1 });
MatchSchema.index({ playerIds: 1, status: 1 });
MatchSchema.index({ groupLabel: 1, tournamentId: 1 });
MatchSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
        // Convert Map to object for JSON serialization
        if (ret.round1Scores) {
            ret.round1Scores = Object.fromEntries(ret.round1Scores);
        }
        if (ret.round2Scores) {
            ret.round2Scores = Object.fromEntries(ret.round2Scores);
        }
        if (ret.preliminaryScores) {
            ret.preliminaryScores = Object.fromEntries(ret.preliminaryScores);
        }
        if (ret.finalScores) {
            ret.finalScores = Object.fromEntries(ret.finalScores);
        }
        return ret;
    },
});
export const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);
