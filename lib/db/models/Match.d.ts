import mongoose, { Document } from 'mongoose';
export type MatchStatus = 'waiting' | 'paired' | 'ready' | 'countdown' | 'in_progress' | 'completed' | 'cancelled' | 'abandoned';
export interface IMatch extends Document {
    _id: mongoose.Types.ObjectId;
    tournamentId: mongoose.Types.ObjectId;
    stage: 'preliminary' | 'final';
    groupLabel: string;
    playerIds: [mongoose.Types.ObjectId, mongoose.Types.ObjectId];
    status: MatchStatus;
    currentRound: number;
    currentQuestionIndex: number;
    roundStartedAt?: Date;
    questionStartedAt?: Date;
    questionDeadlineAt?: Date;
    roundDeadlineAt?: Date;
    round1Scores: Map<string, number>;
    round2Scores: Map<string, number>;
    preliminaryScores: Map<string, number>;
    finalScores?: Map<string, number>;
    winnerId?: mongoose.Types.ObjectId;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Match: mongoose.Model<any, {}, {}, {}, any, any>;
