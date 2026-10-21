import mongoose, { Document } from 'mongoose';
export interface IAuditLog extends Document {
    actorId: mongoose.Types.ObjectId | null;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata: Record<string, unknown>;
    ip: string | null;
    createdAt: Date;
}
export declare const AuditLog: mongoose.Model<any, {}, {}, {}, any, any>;
