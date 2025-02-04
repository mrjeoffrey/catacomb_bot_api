import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  telegram_id: number;
  username: string;
  first_name: String;
  last_name: String;
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

  tap_game_history_per_day: {date: Date; xp: number; gold: number}[];
  tickets_remaining: number;
  tickets_getting_history: {date: Date; number_of_tickets: number; due_to: "daily" | "ad" | null; resetted: boolean}[];
  current_available_taps: number;
}

const userSchema: Schema = new Schema({
  telegram_id: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  first_name: { type: String},
  last_name: { type: String},
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
  limited_time: {type: Date, default:null},
  
  tap_game_history_per_day: [
    {
      date: { type: Date, required: true, default: Date.now },
      xp: { type: Number, default: 0 },
      gold: { type: Number, default: 0 },
    },
  ],
  tickets_remaining: { type: Number, default: 0 },
  tickets_getting_history: [
    {
      date: { type: Date, required: true, default: Date.now },
      number_of_tickets: { type: Number, required: true },
      due_to: { type: String, enum: ["daily", null, "ad"], default: null },
      resetted: { type: Boolean, default: false}
    },
  ],
  current_available_taps: { type: Number, default: 0 },
});

export default mongoose.model<IUser>("User", userSchema);
