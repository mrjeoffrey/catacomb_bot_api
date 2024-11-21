import mongoose, { Schema, Document } from 'mongoose';

export interface ILevel extends Document {
    level: number;
    xp_required: number;
    seconds_for_next_chest_opening: number;
    one_time_bonus_rewards: number | string;
}

const levelSchema: Schema = new Schema({
    level: { type: Number, required: true, unique: true },
    xp_required: { type: Number, required: true },
    seconds_for_next_chest_opening: { type: Number, required: true },
    one_time_bonus_rewards: { type: Schema.Types.Mixed, default: 'n/a' },
});

export default mongoose.model<ILevel>('Level', levelSchema);
