import { Request, Response } from "express";
import Settings from "../models/settingsModel";

// Get Settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Settings
export const updateSettings = async (req: Request, res: Response) => {
  const { opening_chest_earning, referral_earning } = req.body;

  try {
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          opening_chest_earning,
          referral_earning,
        },
      },
      { new: true }
    );

    if (!updatedSettings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
