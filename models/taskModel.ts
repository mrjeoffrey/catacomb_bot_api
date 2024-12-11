import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  name: string;
  link: string;
  avatar_url: string;
  gold_reward: number;
  xp_reward: number;
}

const taskSchema: Schema = new Schema({
  name: { type: String, required: true },
  link: { type: String },
  avatar_url: { type: String },
  gold_reward: { type: Number, required: true, min: 200, max: 500 },
  xp_reward: { type: Number, required: true, default: 400 },
});

export default mongoose.model<ITask>("Task", taskSchema);
