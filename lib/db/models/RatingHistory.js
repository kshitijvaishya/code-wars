import mongoose, { Schema } from 'mongoose';
const RatingHistorySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    battleId: { type: Schema.Types.ObjectId, ref: 'Battle', required: true },
    ratingBefore: { type: Number, required: true },
    ratingAfter: { type: Number, required: true },
    delta: { type: Number, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
export const RatingHistory = mongoose.models.RatingHistory || mongoose.model('RatingHistory', RatingHistorySchema);
