import mongoose, { Document } from 'mongoose';
export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown>;
    isRead: boolean;
    createdAt: Date;
}
export declare const Notification: mongoose.Model<any, {}, {}, {}, any, any>;
