import mongoose, { Document } from 'mongoose';
export interface IPlayerAnswer extends Document {
    _id: mongoose.Types.ObjectId;
    matchId: mongoose.Types.ObjectId;
    playerId: mongoose.Types.ObjectId;
    questionId: mongoose.Types.ObjectId;
    roundType: number;
    selectedOption: string;
    isCorrect: boolean;
    score: number;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PlayerAnswer: mongoose.Model<any, {}, {}, {}, any, any>;
