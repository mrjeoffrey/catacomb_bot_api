import { Request, Response } from 'express';
import Task from '../models/taskModel';

// Create Task (Admin Only)
export const createTask = async (req: Request, res: Response) => {
    const { name, gold_reward, xp_reward } = req.body;

    try {
        const task = new Task({ name, gold_reward, xp_reward });
        await task.save();
        res.json({ message: 'Task created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
