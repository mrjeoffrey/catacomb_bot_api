import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  password: string;
  role: 'admin' | 'moderator' | null; // Role can be 'admin', 'moderator', or null
}

const adminSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'moderator'], default: null }, // Default to null
});

export default mongoose.model<IAdmin>('Admin', adminSchema);
