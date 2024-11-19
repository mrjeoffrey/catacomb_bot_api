import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    telegramId: { type: String, required: true, unique: true },
    username: { type: String },
    gold: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    chestCooldown: { type: Number, default: 120 },
    bonusReward: { type: Number, default: 0 },
});

const User = model('User', userSchema);

export { User };
