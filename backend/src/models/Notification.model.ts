
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    read: boolean;
    relatedId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'], default: 'INFO' },
    read: { type: Boolean, default: false },
    relatedId: { type: Schema.Types.ObjectId }
}, {
    timestamps: true
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
