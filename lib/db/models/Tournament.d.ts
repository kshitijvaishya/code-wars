import mongoose, { Document } from 'mongoose';
export interface IRoundConfig {
    questionCount: number;
    timePerQuestion: number;
    pointsPerQuestion: number;
}
export interface ITournamentConfig {
    round1: IRoundConfig;
    round2: IRoundConfig;
    round3: {
        problemCount: number;
        totalDuration: number;
        pointsPerProblem: number;
    };
}
export interface ITournament extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    status: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled';
    minParticipants: number;
    maxParticipants: number;
    numFinalists: number;
    participantIds: mongoose.Types.ObjectId[];
    roundConfiguration: ITournamentConfig;
    scoringRules: {
        tieBreakers: string[];
    };
    createdBy: mongoose.Types.ObjectId;
    registrationOpenedAt?: Date;
    registrationClosedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Tournament: mongoose.Model<any, {}, {}, {}, any, any>;
