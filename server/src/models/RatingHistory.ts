import mongoose, { Document, Schema } from 'mongoose';

export interface IRatingHistory extends Document {
  userId: mongoose.Types.ObjectId;
  battleId: mongoose.Types.ObjectId;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  createdAt: Date;
}

const RatingHistorySchema = new Schema<IRatingHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    battleId: { type: Schema.Types.ObjectId, ref: 'Battle', required: true },
    ratingBefore: { type: Number, required: true },
    ratingAfter: { type: Number, required: true },
    delta: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const RatingHistory = mongoose.model<IRatingHistory>('RatingHistory', RatingHistorySchema);
