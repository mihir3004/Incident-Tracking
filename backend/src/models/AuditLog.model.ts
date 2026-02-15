import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    action: string;
    details?: string;
    ipAddress?: string;
    userId?: mongoose.Types.ObjectId;
    timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
    action: { type: String, required: true },
    details: { type: String },
    ipAddress: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
