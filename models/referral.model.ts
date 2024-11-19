import { Schema, model } from 'mongoose';

const referralSchema = new Schema({
    userId: { type: String, required: true },
    referredBy: { type: String, required: true },
}, { timestamps: true });

const Referral = model('Referral', referralSchema);

export { Referral };
