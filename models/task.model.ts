import { Schema, model } from 'mongoose';

const taskSchema = new Schema({
    name: { type: String, required: true },
    rewardGold: { type: Number, required: true },
    rewardXp: { type: Number, required: true },
});

const Task = model('Task', taskSchema);

export { Task };
