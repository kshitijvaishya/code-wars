import mongoose, { Schema } from 'mongoose';
const ParticipantSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    rating: { type: Number, required: true },
    status: {
        type: String,
        enum: ['waiting', 'connected', 'ready', 'coding', 'submitted', 'disconnected'],
        default: 'waiting',
    },
    isReady: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    submittedAt: { type: Date, default: null },
    verdict: { type: String, default: null },
    ratingDelta: { type: Number, default: 0 },
    socketId: { type: String, default: null },
    lastSeenAt: { type: Date, default: Date.now },
});
const BattleSchema = new Schema({
    inviteCode: { type: String, required: true, unique: true, index: true },
    inviteExpiresAt: { type: Date, default: null, index: true },
    state: {
        type: String,
        enum: ['WAITING', 'READY_CHECK', 'COUNTDOWN', 'ACTIVE', 'FINALIZING', 'COMPLETED', 'CANCELLED', 'FAILED'],
        default: 'WAITING',
        index: true,
    },
    scoringMode: {
        type: String,
        enum: ['first_accepted', 'score_based', 'time_based', 'best_of_three'],
        default: 'first_accepted',
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    durationSeconds: { type: Number, required: true, default: 1800 },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    participants: { type: [ParticipantSchema], default: [] },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', default: null },
    winnerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDraw: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    finalizationToken: { type: String, default: null },
}, { timestamps: true });
BattleSchema.index({ state: 1, createdAt: -1 });
BattleSchema.index({ 'participants.userId': 1, state: 1 });
BattleSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
    },
});
export const Battle = mongoose.models.Battle || mongoose.model('Battle', BattleSchema);
