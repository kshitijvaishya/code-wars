import mongoose, { Document } from 'mongoose';
import type { BattleState, ScoringMode, ParticipantStatus } from '@code-wars/shared';
export interface IBattleParticipant {
    userId: mongoose.Types.ObjectId;
    username: string;
    avatarUrl: string | null;
    rating: number;
    status: ParticipantStatus;
    isReady: boolean;
    score: number;
    totalScore: number;
    submittedAt: Date | null;
    verdict: string | null;
    ratingDelta: number;
    socketId: string | null;
    lastSeenAt: Date;
}
export interface IBattle extends Document {
    _id: mongoose.Types.ObjectId;
    inviteCode: string;
    inviteExpiresAt: Date | null;
    state: BattleState;
    scoringMode: ScoringMode;
    difficulty: 'easy' | 'medium' | 'hard';
    durationSeconds: number;
    startTime: Date | null;
    endTime: Date | null;
    participants: IBattleParticipant[];
    problemId: mongoose.Types.ObjectId | null;
    winnerId: mongoose.Types.ObjectId | null;
    isDraw: boolean;
    isPrivate: boolean;
    finalizationToken: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Battle: mongoose.Model<any, {}, {}, {}, any, any>;
