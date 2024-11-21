import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    opening_chest_earning: { golds: number[]; xp: number };
    referral_earning: { gold_percentage: number; xp: number };
}

const settingsSchema: Schema = new Schema({
    opening_chest_earning: {
        golds: { type: [Number], default: [75, 100, 125, 150] },
        xp: { type: Number, default: 0 },
    },
    referral_earning: {
        gold_percentage: { type: Number, default: 10 },
        xp: { type: Number, default: 0 },
    },
});

export default mongoose.model<ISettings>('Settings', settingsSchema);
