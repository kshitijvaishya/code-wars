import mongoose, { Schema } from 'mongoose';
const CodeDraftSchema = new Schema({
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    language: { type: String, required: true },
    sourceCode: { type: String, default: '' },
}, { timestamps: { createdAt: false, updatedAt: true } });
// Unique draft per match/player/question/language
CodeDraftSchema.index({ matchId: 1, playerId: 1, questionId: 1, language: 1 }, { unique: true });
CodeDraftSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
    },
});
export const CodeDraft = mongoose.models.CodeDraft || mongoose.model('CodeDraft', CodeDraftSchema);
