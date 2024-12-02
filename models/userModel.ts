import mongoose, { Schema, Document, Types } from "mongoose";

// Define IUser interface
export interface IUser extends Document {
  telegram_id: number;
  username: string;
  gold: number;
  xp: number;
  wallet_address: string;
  task_done: Types.ObjectId[]; // Reference Task IDs
  chest_opened_history: { time_opened: Date; level: number }[];
  IP_address: string;
  referred_by: Types.ObjectId | null; // Reference User ID
  blocked: boolean;
}

// Define the User schema
const userSchema: Schema = new Schema({
  telegram_id: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  gold: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  wallet_address: { type: String },
  task_done: { type: [Types.ObjectId], ref: "Task", default: [] }, // Array of Task references
  chest_opened_history: [
    {
      time_opened: { type: Date, default: Date.now },
      level: { type: Number, required: true },
    },
  ],
  IP_address: { type: String },
  referred_by: { type: Types.ObjectId, ref: "User", default: null }, // Reference another User
  blocked: { type: Boolean, default: false },
});

export default mongoose.model<IUser>("User", userSchema);
