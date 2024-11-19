import { Request, Response } from 'express';
import Task, { ITask } from '../models/Task';

export const getTasks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tasks: ITask[] = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
