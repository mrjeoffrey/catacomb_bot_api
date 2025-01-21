import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import Settings from "../models/settingsModel";
import levelModel from "../models/levelModel";
import { handleReferralRewards } from "./userController";
import { getUserLevel } from "./levelController";

export const calculateChestOpeningTime = (
  user: any,
  seconds_for_next_chest_opening: number
): number => {
  const now = Date.now();

  if (user.chest_opened_history && user.chest_opened_history.length > 0) {
    const lastChestOpened =
      user.chest_opened_history[user.chest_opened_history.length - 1];
    const lastOpenedTime = new Date(lastChestOpened.time_opened).getTime();

    const timeDifference = (now - lastOpenedTime) / 1000;

    if (timeDifference >= seconds_for_next_chest_opening) {
      return 0;
    } else {
      return Math.floor(seconds_for_next_chest_opening - timeDifference);
    }
  } else {
    const userJoinedTime = new Date(user.created_at).getTime();
    const timeDifference = (now - userJoinedTime) / 1000;
    if (timeDifference >= seconds_for_next_chest_opening) {
      return 0;
    } else {
      return Math.floor(seconds_for_next_chest_opening - timeDifference);
    }
  }
};

// Open Chest
export const openChest = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;

  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch the settings
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(500).json({ message: "Settings not found" });
    }
    const { seconds_for_next_chest_opening } =
      getUserLevel(user.xp);
    // Get the current time
    const currentTime = new Date();

    if (user.chest_opened_history && user.chest_opened_history.length > 0) {
      // Get the last chest opened time
      const lastChestOpened = user.chest_opened_history[user.chest_opened_history.length - 1];
      const currentTime = new Date();

      const timeSinceLastOpen = (currentTime.getTime() - new Date(lastChestOpened?.time_opened).getTime()) / 1000; // in seconds
      if (timeSinceLastOpen < seconds_for_next_chest_opening) {
        const remainingTime = seconds_for_next_chest_opening - timeSinceLastOpen;
        return res.status(400).json({
          message: "Chest opening is not available yet. Please wait",
          remainingTime,
        });
      }
    }
    // If limited_time exists, check if the 24-hour cooldown period is over
    if (user.limited_time) {
      const timeSinceCooldownStarted = (currentTime.getTime() - new Date(user.limited_time).getTime()) / 1000; // in seconds

      // If the cooldown is still active (within 24 hours)
      if (timeSinceCooldownStarted < 24 * 60 * 60) {
        const remainingTime = 24 * 60 * 60 - timeSinceCooldownStarted; // Remaining cooldown time in seconds
        const hours = Math.floor(remainingTime / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = Math.floor(remainingTime % 60);

        return res.status(400).json({
          message: "Daily limit reached",
          remainingTime: `${hours}:${minutes}:${seconds}`, // Display the countdown in HH:MM:SS format
          currentTime: currentTime,  // Current time as Date
          limitedTime: user.limited_time, // limited_time as Date
        });
      }
    }

    // Check if the user has opened `daily_opening_chests_limit` chests within the last 24 hours
    const chestsOpenedInLast24Hours = user.chest_opened_history.filter(
      (chest) => (currentTime.getTime() - new Date(chest.time_opened).getTime()) <= 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    );

    // If the user has already opened the max number of chests within 24 hours, trigger the cooldown
    if (chestsOpenedInLast24Hours.length >= settings.daily_opening_chests_limit) {
      user.limited_time = currentTime; // Set the limited_time to the current time when the cooldown starts
      await user.save();

      const remainingTime = 24 * 60 * 60; // 24 hours cooldown
      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      const seconds = Math.floor(remainingTime % 60);

      return res.status(400).json({
        message: "Daily limit reached",
        remainingTime: `${hours}:${minutes}:${seconds}`, // Display the countdown in HH:MM:SS format
        currentTime: currentTime,  // Current time as Date
        limitedTime: user.limited_time, // limited_time as Date
      });
    }

    // Rewards logic
    const golds = settings.opening_chest_earning.golds;
    const gold_reward = golds[Math.floor(Math.random() * golds.length)];
    const xp_reward = settings.opening_chest_earning.xp;

    // Add to chest opened history
    user.chest_opened_history.push({
      time_opened: new Date(),
      xp: xp_reward,
      gold: gold_reward,
    });

    // Handle referral logic
    await handleReferralRewards(user, gold_reward);

    await user.save();
    res.json({
      message: "Chest opened",
      gold: gold_reward,
      xp: xp_reward,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
