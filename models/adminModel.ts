import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
    email: string;
    password: string;
}

const adminSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

export default mongoose.model<IAdmin>('Admin', adminSchema);
