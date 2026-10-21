import mongoose, { Schema } from 'mongoose';
const NotificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
