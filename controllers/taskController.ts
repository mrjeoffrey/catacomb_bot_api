import { Request, Response } from "express";
import multer, { MulterError } from "multer";
import path from "path";
import fs from "fs";
import Task from "../models/taskModel";
import { decodeBase64Image } from "../utils/decodeBase64Image";

const ensureImagesFolderExists = () => {
  const imagesFolderPath = path.join(__dirname, "../public/images");

  if (!fs.existsSync(imagesFolderPath)) {
    fs.mkdirSync(imagesFolderPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureImagesFolderExists();

    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const finalFileName =
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);

    cb(null, finalFileName);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Invalid file type");
    return cb(null, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createTask = async (req: Request, res: Response) => {
  const { name, gold_reward, xp_reward, description, avatar_url } = req.body;
  let savedFilePath = "";
  if (avatar_url) {
    try {
      const fileData = decodeBase64Image(avatar_url);
      const uniqueFileName = `avatar-${Date.now()}.png`;
      const filePath = path.join(__dirname, "../public/images", uniqueFileName);

      fs.writeFileSync(filePath, fileData.data);
      savedFilePath = `/images/${uniqueFileName}`;
    } catch (error) {
      return res.status(400).json({ message: "Invalid image format" });
    }
  }

  try {
    const task = new Task({
      name,
      gold_reward,
      xp_reward,
      avatar_url: savedFilePath,
      description,
    });
    await task.save();
    res.json({ message: "Task created successfully", task });
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

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, gold_reward, xp_reward } = req.body;
  const avatar_url = req.file ? `/images/${req.file.filename}` : undefined;

  try {
    const task = await Task.findByIdAndUpdate(
      id,
      { name, gold_reward, xp_reward, avatar_url },
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

export const removeTask = async (req: Request, res: Response) => {
  const { id } = req.params;

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

export const uploadAvatar = upload.single("avatar_url");
