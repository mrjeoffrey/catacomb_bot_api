import { Request, Response } from "express";
import multer, { MulterError } from "multer";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import Task from "../models/taskModel";
import Settings from "../models/settingsModel";
import { decodeBase64Image } from "../utils/decodeBase64Image";
import User, { IUser } from "../models/userModel";
import mongoose from "mongoose";

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
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
    "image/tiff",
  ];

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
  const { name, gold_reward, xp_reward, link, avatar_url } = req.body;
  let savedFilePath = "";
  if (avatar_url) {
    try {
      const fileData = decodeBase64Image(avatar_url);
      const mimeType = fileData.type;
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json({ message: "Unsupported image type" });
      }
      const fileExtension = mime.extension(mimeType);
      const uniqueFileName = `avatar-${Date.now()}.${fileExtension}`;
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
      link,
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

//Task Proof
export const taskProofingOrder = async (req: Request, res: Response) => {
  const { telegram_id, task_id, image, url } = req.body;
  let savedFilePath = "";

  if (image) {
    try {
      const fileData = decodeBase64Image(image);
      const mimeType = fileData.type;
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json({ message: "Unsupported image type" });
      }

      const fileExtension = mime.extension(mimeType);
      const uniqueFileName = `image-${Date.now()}.${fileExtension}`;
      const filePath = path.join(__dirname, "../public/images", uniqueFileName);

      fs.writeFileSync(filePath, fileData.data);
      savedFilePath = `/images/${uniqueFileName}`;
    } catch (error) {
      return res.status(400).json({ message: "Invalid image format" });
    }
  }

  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const existingTask = user.task_done.find(
      (task) => task.task_id.toString() === task_id
    );

    if (existingTask) {
      if (
        existingTask.proof_img &&
        fs.existsSync(
          path.join(__dirname, `../public${existingTask.proof_img}`)
        )
      ) {
        fs.unlinkSync(
          path.join(__dirname, `../public${existingTask.proof_img}`)
        );
      }

      // Update task details
      existingTask.proof_img = savedFilePath;
      existingTask.proof_url = url;
      existingTask.completed_date = new Date();
      existingTask.validation_status = "unchecked";
    } else {
      // Add new task if it doesn't exist
      user.task_done.push({
        task_id,
        proof_img: savedFilePath,
        proof_url: url,
        completed_date: new Date(),
        validation_status: "unchecked",
      });
    }

    // Save user data
    await user.save();

    res.json({
      message:
        "Your task is currently under review by the admin, along with your proof data.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Checked Task Status by Admin
export const checkTask = async (req: Request, res: Response) => {
  const { telegram_id, task_id } = req.body;
  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const task = await Task.findById(task_id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const updatedUser = await User.findOneAndUpdate(
      {
        telegram_id,
        "task_done.task_id": new mongoose.Types.ObjectId(task_id),
      },
      {
        $set: { "task_done.$.validation_status": "checked" },
      },
      {
        new: true,
      }
    );

    res.json({
      message: "The task status checked by Admin.",
      updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Complete Task
export const validateTask = async (req: Request, res: Response) => {
  const { telegram_id, task_id } = req.body;
  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const task = await Task.findById(task_id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const updatedUser = await User.findOneAndUpdate(
      {
        telegram_id,
        "task_done.task_id": new mongoose.Types.ObjectId(task_id),
      },
      {
        $set: { "task_done.$.validation_status": "validated" },
      },
      {
        new: true,
      }
    );

    user.gold += task.gold_reward;
    user.xp += task.xp_reward;

    // Handle referral logic
    if (user.referred_by) {
      const settings = await Settings.findOne();
      if (!settings) {
        return res.status(500).json({ message: "Settings not found" });
      }
      const referrer = await User.findById(user.referred_by);
      if (referrer) {
        const isAlreadyValidReferral = referrer.valid_referrals.some(
          (referral) => referral.id.equals(user._id)
        );
        console.log(user, "validating user");
        if (!isAlreadyValidReferral) {
          if (user.gold > 0) {
            referrer.valid_referrals.push({
              id: user._id,
              time_added: new Date(),
            });
            referrer.xp += 100;
          }
        }
        const referralGoldReward = Math.floor(
          (settings.referral_earning.gold_percentage / 100) * task.gold_reward
        );
        referrer.gold += referralGoldReward;
        referrer.xp += settings.referral_earning.xp;
        console.log(referrer, "referrer");
        await referrer.save();
      }
    }

    await user.save();

    res.json({
      message: "The task validation has been completed.",
      updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, gold_reward, xp_reward, link } = req.body;
  const avatar_url = req.file ? `/images/${req.file.filename}` : undefined;

  try {
    const task = await Task.findByIdAndUpdate(
      id,
      { name, gold_reward, xp_reward, avatar_url, link },
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

    if (task.avatar_url) {
      const filePath = path.join(__dirname, "../public", task.avatar_url);

      // Check if the file exists and delete it
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Image file ${filePath} has been removed successfully.`);
      }
    }

    res.json({ message: "Task removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const uploadAvatar = upload.single("avatar_url");
export const uploadImage = upload.single("image");
