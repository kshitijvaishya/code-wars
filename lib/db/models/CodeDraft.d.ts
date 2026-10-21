import mongoose, { Document } from 'mongoose';
export interface ICodeDraft extends Document {
    _id: mongoose.Types.ObjectId;
    matchId: mongoose.Types.ObjectId;
    playerId: mongoose.Types.ObjectId;
    questionId: mongoose.Types.ObjectId;
    language: string;
    sourceCode: string;
    updatedAt: Date;
}
export declare const CodeDraft: mongoose.Model<any, {}, {}, {}, any, any>;
