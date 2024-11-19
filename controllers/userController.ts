import { Request, Response } from 'express';
import User, { IUser } from '../models/User';

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user: IUser | null = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.json(user);
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// Additional user logic (update XP, gold, etc.)
