import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITapGameLevel extends Document {
  tap_level: number;
  required_user_levels: Types.ObjectId[] | null;
  xp_earning_per_tap: number;
  gold_earning_per_tap: number;
  pyramid_image_url: string | null;
  tap_limit_per_ticket: number;
}

const tapGameLevelSchema: Schema = new Schema({
  tap_level: { type: Number, required: true, unique: true },
  required_user_levels: {
    type: [Types.ObjectId],
    ref: "Level"
  },
  xp_earning_per_tap: { type: Number, required: true}, //1, 2, 3
  gold_earning_per_tap: { type: Number, required: true}, //1, 2, 3;
  pyramid_image_url: { type: String },
  tap_limit_per_ticket: { type: Number, required: true, default: 50}
});

export default mongoose.model<ITapGameLevel>("TapGame", tapGameLevelSchema);
