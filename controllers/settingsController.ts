import { Request, Response } from 'express';
import Settings from '../models/settingsModel';

// Get Settings
export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await Settings.findOne();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
