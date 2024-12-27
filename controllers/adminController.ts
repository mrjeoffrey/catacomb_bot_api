import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel";
import User from "../models/userModel";
import Task from "../models/taskModel";
import Settings from "../models/settingsModel";
import Level from "../models/levelModel";
import { JWT_SECRET } from "../config/config";
import { isValidObjectId } from "mongoose";

// Register Admin
export const registerAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const newAdmin = new Admin({ email, password });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Login
export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ email: admin.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Remove User by ID
export const removeUser = async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User removed successfully" });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to delete User" });
  }
};

// Block User
export const blockUser = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { telegram_id },
      { blocked: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Edit Task
export const editTask = async (req: Request, res: Response) => {
  const { task_id, name, gold_reward, xp_reward } = req.body;

  try {
    const task = await Task.findByIdAndUpdate(
      task_id,
      { name, gold_reward, xp_reward },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Settings
export const updateSettings = async (req: Request, res: Response) => {
  const { opening_chest_earning, referral_earning } = req.body;

  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { opening_chest_earning, referral_earning },
      { new: true, upsert: true }
    );

    res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Insert Level
export const insertLevel = async (req: Request, res: Response) => {
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
    res
      .status(201)
      .json({ message: "Level added successfully", level: newLevel });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Level
export const updateLevel = async (req: Request, res: Response) => {
  const {
    level,
    xp_required,
    seconds_for_next_chest_opening,
    one_time_bonus_rewards,
  } = req.body;

  try {
    const updatedLevel = await Level.findOneAndUpdate(
      { level },
      { xp_required, seconds_for_next_chest_opening, one_time_bonus_rewards },
      { new: true }
    );

    if (!updatedLevel) {
      return res.status(404).json({ message: "Level not found" });
    }

    res.json({ message: "Level updated successfully", level: updatedLevel });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const removeChestOpenedHistory = async (req: Request, res: Response) => {
  const { telegram_id, count } = req.body;
  console.log(telegram_id, count, "telegram_id, count");
  const parsedCount = parseInt(count, 10);
  
  if (isNaN(parsedCount) || parsedCount <= 0) {
    return res.status(400).json({ message: "Invalid parsedCount value" });
  }

  try {
     const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sortedHistory = user.chest_opened_history
      .sort((a, b) => new Date(a.time_opened).getTime() - new Date(b.time_opened).getTime())
      .slice(-parsedCount);

    user.chest_opened_history = sortedHistory;
    await user.save();

    res.json({
      message: "Chest opened history updated successfully",
      remainingHistory: sortedHistory,
    });
  } catch (error) {
    console.error("Error removing chest opened history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

