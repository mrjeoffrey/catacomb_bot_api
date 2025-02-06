import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChat extends Document {
  telegram_id: number;
  message_id: number;
  text: string;
  date: Date;
  from_bot: boolean;
}

const chatSchema: Schema = new Schema({
  telegram_id: { type: Number, required: true },
  message_id: { type: Number, required: true },
  text: { type: String, required: true },
  date: { type: Date, required: true },
  from_bot: { type: Boolean, required: true },
});

export default mongoose.model<IChat>("Chat", chatSchema);
