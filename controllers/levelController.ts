import { Request, Response } from 'express';
import Level from '../models/levelModel';

// Get Level Info
export const getLevelInfo = async (req: Request, res: Response) => {
    try {
        const levels = await Level.find();
        res.json({ levels });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
