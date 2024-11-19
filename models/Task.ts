import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  description: string;
  goldReward: number;
  xpReward: number;
}

const taskSchema: Schema = new Schema({
  description: { type: String, required: true },
  goldReward: { type: Number, required: true },
  xpReward: { type: Number, required: true }
});

export default mongoose.model<ITask>('Task', taskSchema);
