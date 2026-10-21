import mongoose, { Schema } from 'mongoose';
const PlayerAnswerSchema = new Schema({
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    roundType: { type: Number, required: true },
    selectedOption: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    score: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });
// Prevent duplicate answers
PlayerAnswerSchema.index({ matchId: 1, playerId: 1, questionId: 1 }, { unique: true });
PlayerAnswerSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
    },
});
export const PlayerAnswer = mongoose.models.PlayerAnswer || mongoose.model('PlayerAnswer', PlayerAnswerSchema);
