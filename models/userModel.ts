import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  telegram_id: number;
  username: string;
  gold: number;
  xp: number;
  wallet_address: string;
  task_done: {
    task_id: Types.ObjectId;
    completed_date: Date;
    proof_img: string;
    proof_url: string;
    validation_status: "unchecked" | "checked" | "validated";
  }[];
  chest_opened_history: { time_opened: Date; xp: number; gold: number }[];
  IP_address: string;
  location: string;
  referral_code: string;
  referred_by: Types.ObjectId | null;
  valid_referrals: { id: Types.ObjectId; time_added: Date }[];
  blocked: boolean;
  created_at: Date;
  current_season_xp: number;
  current_season_gold: number;
  limited_time: Date;
}

const userSchema: Schema = new Schema({
  telegram_id: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  gold: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  wallet_address: { type: String },
  task_done: [
    {
      task_id: { type: Types.ObjectId, ref: "Task", required: true },
      completed_date: { type: Date, default: Date.now },
      proof_img: { type: String },
      proof_url: { type: String },
      validation_status: {
        type: String,
        enum: ["unchecked", "checked", "validated"],
        default: "unchecked",
      },
    },
  ],
  chest_opened_history: [
    {
      time_opened: { type: Date, default: Date.now },
      xp: { type: Number, required: true },
      gold: { type: Number, required: true },
    },
  ],
  IP_address: { type: String },
  location: { type: String },
  referral_code: { type: String, unique: true, required: true },
  referred_by: { type: Types.ObjectId, ref: "User", default: null },
  valid_referrals: [
    {
      id: { type: Types.ObjectId, ref: "User", required: true },
      time_added: { type: Date, default: Date.now },
    },
  ],
  blocked: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  current_season_xp: { type: Number, default: 0},
  current_season_gold: { type: Number, default: 0 },
  limited_time: {type: Date, default:null}
});

export default mongoose.model<IUser>("User", userSchema);
