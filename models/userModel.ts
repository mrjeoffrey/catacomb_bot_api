import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    telegram_id: number;
    username: string;
    gold: number;
    xp: number;
    wallet_address: string;
    task_done: number[];
    chest_opened_history: { time_opened: Date; level: number }[];
    IP_address: string;
    referred_by: string;
    blocked: boolean;
}

const userSchema: Schema = new Schema({
    telegram_id: { type: Number, required: true, unique: true },
    username: { type: String, required: true },
    gold: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    wallet_address: { type: String, required: true },
    task_done: { type: [Number], default: [] },
    chest_opened_history: [
        {
            time_opened: { type: Date, default: Date.now },
            level: { type: Number, required: true },
        },
    ],
    IP_address: { type: String, required: true },
    referred_by: { type: String, default: null },
    blocked: { type: Boolean, default: false },
});

export default mongoose.model<IUser>('User', userSchema);
