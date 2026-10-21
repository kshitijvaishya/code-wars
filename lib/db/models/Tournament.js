import mongoose, { Schema } from 'mongoose';
const TournamentSchema = new Schema({
    name: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['draft', 'registration', 'in_progress', 'completed', 'cancelled'],
        default: 'draft',
        index: true,
    },
    minParticipants: { type: Number, default: 4 },
    maxParticipants: { type: Number, default: 32 },
    numFinalists: { type: Number, default: 2 },
    participantIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    roundConfiguration: {
        round1: {
            questionCount: { type: Number, default: 15 },
            timePerQuestion: { type: Number, default: 45 },
            pointsPerQuestion: { type: Number, default: 10 },
        },
        round2: {
            questionCount: { type: Number, default: 5 },
            timePerQuestion: { type: Number, default: 150 },
            pointsPerQuestion: { type: Number, default: 50 },
        },
        round3: {
            problemCount: { type: Number, default: 2 },
            totalDuration: { type: Number, default: 1800 },
            pointsPerProblem: { type: Number, default: 100 },
        },
    },
    scoringRules: {
        tieBreakers: {
            type: [String],
            default: ['round2Score', 'round1Score', 'mcqCorrect', 'submissionTime'],
        },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registrationOpenedAt: Date,
    registrationClosedAt: Date,
    startedAt: Date,
    completedAt: Date,
}, { timestamps: true });
TournamentSchema.index({ status: 1, createdAt: -1 });
TournamentSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
    },
});
export const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
