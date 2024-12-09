import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  telegram_id: number;
  username: string;
  gold: number;
  xp: number;
  wallet_address: string;
  task_done: Types.ObjectId[];
  chest_opened_history: { time_opened: Date; xp: number; gold: number }[];
  IP_address: string;
  location: string;
  referral_code: string;
  referred_by: Types.ObjectId | null;
  valid_referrals: { id: Types.ObjectId; time_added: Date }[];
  blocked: boolean;
  created_at: Date;
}

const userSchema: Schema = new Schema({
  telegram_id: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  gold: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  wallet_address: { type: String },
  task_done: { type: [Types.ObjectId], ref: "Task", default: [] },
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
});

export default mongoose.model<IUser>("User", userSchema);
