import mongoose, { Document } from 'mongoose';
export interface IRatingHistory extends Document {
    userId: mongoose.Types.ObjectId;
    battleId: mongoose.Types.ObjectId;
    ratingBefore: number;
    ratingAfter: number;
    delta: number;
    createdAt: Date;
}
export declare const RatingHistory: mongoose.Model<any, {}, {}, {}, any, any>;
