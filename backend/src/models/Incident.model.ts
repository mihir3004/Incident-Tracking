import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
    title: string;
    description: string;
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    evidenceUrl?: string;
    userId: mongoose.Types.ObjectId;
    assignedTo?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

const IncidentSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
    evidenceUrl: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

export default mongoose.model<IIncident>('Incident', IncidentSchema);
