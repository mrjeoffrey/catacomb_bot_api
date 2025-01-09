import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  name: string;
  link: string;
  avatar_url: string;
  gold_reward: number;
  xp_reward: number;
  is_auto_check: boolean;
  group_bot_token: string;
  is_limited: boolean;
  cashtag_for_username: string;
  order_index: number;
}

const taskSchema: Schema = new Schema({
  name: { type: String, required: true },
  link: { type: String },
  avatar_url: { type: String },
  gold_reward: { type: Number, required: true, min: 200, max: 500 },
  xp_reward: { type: Number, required: true, default: 400 },
  is_auto_check: { type: Boolean, default: false },
  group_bot_token: { type: String, default: null },
  is_limited: { type: Boolean, default: false },
  cashtag_for_username: { type: String, default: null },
  order_index: { type: Number },
});

export default mongoose.model<ITask>("Task", taskSchema);
