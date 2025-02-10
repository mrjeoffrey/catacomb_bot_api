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

let levelsCache: any[] = [];

export const loadLevelsInMemory = async () => {
  try {
    levelsCache = await Level.find().sort({ xp_required: 1 });
  } catch (error) {
    console.error("Error loading levels:", error);
  }
};

let userLevelsCache: {
  [key: string]: {
    level: number;
    seconds_for_next_chest_opening: number;
    percentage_to_next_level: number;
    expiry: number;
  };
} = {};

export const getUserLevel = (
  userXp: number
): { level: number; seconds_for_next_chest_opening: number, percentage_to_next_level: number } => {
  // Check if the level is cached and not expired
  const cached = userLevelsCache[userXp];
  if (cached && cached.expiry > Date.now()) {
    return {
      level: cached.level,
      seconds_for_next_chest_opening: cached.seconds_for_next_chest_opening,
      percentage_to_next_level: cached.percentage_to_next_level
    }; // Return cached level and chest opening seconds
  }

  // If not cached, calculate the level
  const { level, seconds_for_next_chest_opening, percentage_to_next_level } = calculateUserLevel(userXp);

  // Cache the level for 30 seconds
  userLevelsCache[userXp] = {
    level,
    seconds_for_next_chest_opening,
    percentage_to_next_level,
    expiry: Date.now() + 30000, // Cache expires in 30 seconds
  };

  return { level, seconds_for_next_chest_opening, percentage_to_next_level };
};

const calculateUserLevel = (
  userXp: number
): { level: number; seconds_for_next_chest_opening: number; percentage_to_next_level: number } => {
  let userLevel = 1;
  let secondsForNextChest = 0;
  let percentageToNextLevel = 100;

  for (let i = 0; i < levelsCache.length; i++) {
    const level = levelsCache[i];
    if (userXp >= level.xp_required) {
      userLevel = level.level;
      secondsForNextChest = level.seconds_for_next_chest_opening;
      if (i < levelsCache.length - 1) {
        const nextLevelXp = levelsCache[i + 1].xp_required;
        percentageToNextLevel = (userXp / nextLevelXp) * 100;
      } else {
        percentageToNextLevel = 100;
      }
    } else {
      break;
    }
  }

  return {
    level: userLevel,
    seconds_for_next_chest_opening: secondsForNextChest,
    percentage_to_next_level: percentageToNextLevel,
  };
};
