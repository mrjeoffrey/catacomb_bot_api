import { Request, Response } from "express";
import Level from "../models/levelModel";

// Get All Levels
export const getAllLevels = async (req: Request, res: Response) => {
  try {
    const levels = await Level.find(); // Retrieve all levels from the database
    res.json(levels);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create Level
export const createLevel = async (req: Request, res: Response) => {
  const {
    level,
    xp_required,
    seconds_for_next_chest_opening,
    one_time_bonus_rewards,
  } = req.body;
  try {
    const newLevel = new Level({
      level,
      xp_required,
      seconds_for_next_chest_opening,
      one_time_bonus_rewards,
    });
    await newLevel.save();
    res.json({ message: "Level created successfully", level: newLevel });
  } catch (error: any) {
    console.error(error?.message);
    res
      .status(500)
      .json({ message: error?.message || "Failed to create level" });
  }
};

// Update Level by ID
export const updateLevel = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    level,
    xp_required,
    seconds_for_next_chest_opening,
    one_time_bonus_rewards,
  } = req.body;

  try {
    const updatedLevel = await Level.findByIdAndUpdate(
      id,
      {
        level,
        xp_required,
        seconds_for_next_chest_opening,
        one_time_bonus_rewards,
      },
      { new: true, runValidators: true }
    );

    if (!updatedLevel) {
      return res.status(404).json({ message: "Level not found" });
    }

    res.json({ message: "Level updated successfully", level: updatedLevel });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to update level" });
  }
};

// Remove Level by ID
export const removeLevel = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedLevel = await Level.findByIdAndDelete(id);

    if (!deletedLevel) {
      return res.status(404).json({ message: "Level not found" });
    }

    res.json({ message: "Level removed successfully" });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to delete level" });
  }
};
