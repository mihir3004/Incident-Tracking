import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    isBlocked: boolean;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], default: 'USER' },
    isBlocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
