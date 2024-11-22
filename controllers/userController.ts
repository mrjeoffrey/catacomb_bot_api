import { Request, Response } from "express";
import User from "../models/userModel";

// Get All Users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const user = await User.find();
    console.log("/user", user);
    if (!user) {
      return res.status(404).json({ message: "Users not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get User Info
export const getUserInfo = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;

  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Complete Task
export const completeTask = async (req: Request, res: Response) => {
  const { telegram_id, task_id } = req.body;

  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Logic to complete the task, add rewards, etc.
    user.task_done.push(task_id);
    user.gold += 300; // Example reward
    user.xp += 400; // Example reward
    await user.save();

    res.json({
      message: "Task completed successfully",
      gold_reward: 300,
      xp_reward: 400,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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

    // Logic for chest opening, add gold and xp rewards
    const gold_reward = 100; // Example gold reward
    const xp_reward = 50; // Example XP reward

    user.gold += gold_reward;
    user.xp += xp_reward;
    user.chest_opened_history.push({ time_opened: new Date(), level: user.xp });

    await user.save();
    res.json({ message: "Chest opened", gold: gold_reward, xp: xp_reward });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Referral Program
export const refer = async (req: Request, res: Response) => {
  const { telegram_id, referral_code } = req.body;

  try {
    const user = await User.findOne({ telegram_id });
    const referrer = await User.findOne({ username: referral_code });

    if (!user || !referrer) {
      return res.status(404).json({ message: "User or referrer not found" });
    }

    // Logic to apply referral earnings
    user.referred_by = referral_code;
    user.gold += 100; // Referral bonus example
    await user.save();

    referrer.gold += 10; // Referral bonus for referrer
    await referrer.save();

    res.json({ message: "Referral successful", referral_earnings: 10 });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
