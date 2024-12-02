import { Request, Response } from "express";
import Task from "../models/taskModel";

// Get All Tasks
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find(); // Retrieve all tasks from the database
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create Task (Admin Only)
export const createTask = async (req: Request, res: Response) => {
  const { name, gold_reward, xp_reward } = req.body;

  try {
    const task = new Task({ name, gold_reward, xp_reward });
    await task.save();
    res.json({ message: "Task created successfully" });
  } catch (error: any) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: Object.values(error.errors).map((err: any) => err.message),
      });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Update Task by ID (Admin Only)
export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, gold_reward, xp_reward } = req.body;

  try {
    const task = await Task.findByIdAndUpdate(
      id,
      { name, gold_reward, xp_reward },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task updated successfully", task });
  } catch (error: any) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: Object.values(error.errors).map((err: any) => err.message),
      });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Remove Task by ID (Admin Only)
export const removeTask = async (req: Request, res: Response) => {
  const { id } = req.params; // Get task ID from the URL

  try {
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
