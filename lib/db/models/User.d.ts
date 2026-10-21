import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
    passwordHash: string;
    role: 'user' | 'contest_admin' | 'super_admin';
    avatarUrl: string | null;
    bio: string | null;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    winStreak: number;
    totalBattles: number;
    isSuspended: boolean;
    refreshTokens: string[];
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidate: string): Promise<boolean>;
}
export declare const User: mongoose.Model<any, {}, {}, {}, any, any>;
