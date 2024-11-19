import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  gold: number;
  xp: number;
  level: number;
  lastChestOpened: Date | null;
}

const userSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  gold: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastChestOpened: { type: Date, default: null }
});

export default mongoose.model<IUser>('User', userSchema);
