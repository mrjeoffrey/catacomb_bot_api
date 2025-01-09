import { Request, Response } from "express";
import multer, { MulterError } from "multer";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import Task from "../models/taskModel";
import Settings from "../models/settingsModel";
import { decodeBase64Image } from "../utils/decodeBase64Image";
import User, { IUser } from "../models/userModel";
import mongoose, { Types } from "mongoose";
import axios from "axios";
import { handleReferralRewards } from "./userController";

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
});

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({
      $or: [
        { is_limited: false },
        { is_limited: null },
        { is_limited: { $exists: false } },
      ],
    }).sort("order_index");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllLimitedAndUnlimitedTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.aggregate([
      {
        $lookup: {
          from: "users", // MongoDB collection name for the User model
          let: { taskId: "$_id" },
          pipeline: [
            { $unwind: "$task_done" },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$task_done.task_id", "$$taskId"] },
                    { $eq: ["$task_done.validation_status", "validated"] },
                  ],
                },
              },
            },
          ],
          as: "validated_users",
        },
      },
      {
        $addFields: {
          validated_count: { $size: "$validated_users" },
        },
      },
      {
        $project: {
          validated_users: 0, // Exclude validated_users details from the result
        },
      },
      {
        $sort: { order_index: 1 },
      },
    ]);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createTask = async (req: Request, res: Response) => {
  const {
    name,
    gold_reward,
    xp_reward,
    link,
    avatar_url,
    is_auto_check,
    group_bot_token,
    cashtag_for_username,
  } = req.body;

  let savedFilePath = "";

  // Handle avatar URL
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

  // Create the new task
  try {
    const newTask = new Task({
      name,
      gold_reward,
      xp_reward,
      link,
      avatar_url: savedFilePath,
      is_auto_check: is_auto_check || false,
      group_bot_token: group_bot_token || null,
      cashtag_for_username: cashtag_for_username || null,
    });

    // Save the task to the database
    await newTask.save();

    res
      .status(201)
      .json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//Task Proof
export const taskProofingOrder = async (req: Request, res: Response) => {
  const { telegram_id, task_id, image, url } = req.body;
  let savedFilePath = "";

  try {
    const task = await Task.findById(task_id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (task.is_auto_check) {
      const existingTask = user.task_done.find(
        (task) => task.task_id.toString() === task_id
      );

      if (existingTask && existingTask?.validation_status === "validated") {
        return res.json({
          message: "You have already done this task.",
        });
      } else {
        // Telegram group check logic
        if (task.group_bot_token) {
          const chat_id = task.link.split("/").pop(); // Extract @group_name from the link
          const bot_token = task.group_bot_token || null;

          const response = await axios.get(
            `https://api.telegram.org/bot${bot_token}/getChatMember`,
            {
              params: {
                chat_id: `@${chat_id}`,
                user_id: telegram_id,
              },
            }
          );

          const chatMember = response.data;


          if (!chatMember.ok || chatMember.result.status === "left") {
            return res.status(400).json({
              message: "User is not a member of the required Telegram group.",
            });
          }

          console.log("11111111111",task?.cashtag_for_username)
          console.log("2222222222",chatMember.result.user)
          console.log("3333333",chatMember.result.user.first_name)
          console.log("444444444",chatMember.result.user.last_name)
          console.log("5555555555555", chatMember.result.user.first_name.includes(task?.cashtag_for_username))


          console.log("++++++++++++++", task?.cashtag_for_username,chatMember.result.user.first_name.includes(task?.cashtag_for_username) 
          , chatMember.result.user.last_name.includes(task?.cashtag_for_username), chatMember.result.user.first_name.includes(task?.cashtag_for_username) 
          || (chatMember.result.user.last_name && chatMember.result.user.last_name.includes(task?.cashtag_for_username)))

          if (task?.cashtag_for_username && task?.cashtag_for_username !== "") {
            if (chatMember.result.user.first_name.includes(task?.cashtag_for_username) 
              || (chatMember.result.user.last_name && chatMember.result.user.last_name.includes(task?.cashtag_for_username))) {
              await handleReferralRewards(user, task.gold_reward);
              await user.save();

              // If user is in the group & has specific cashtag at his username, directly validate the task
              user.task_done.push({
                task_id,
                proof_img: "", // No proof image needed
                proof_url: url || "", // Optional proof URL
                completed_date: new Date(),
                validation_status: "validated", // Directly mark as validated
              });

              await user.save();

              return res.json({
                message:
                  "Task validated successfully as the user has cashtag in User Name.",
              });
            } else {
              return res.status(400).json({
                message: "User hasnt got cashtag in User Name.",
              });
            }
          } else {
            // Handle referral logic
            await handleReferralRewards(user, task.gold_reward);
            await user.save();

            // If user is in the group, directly validate the task
            user.task_done.push({
              task_id,
              proof_img: "", // No proof image needed
              proof_url: url || "", // Optional proof URL
              completed_date: new Date(),
              validation_status: "validated", // Directly mark as validated
            });

            await user.save();

            return res.json({
              message:
                "Task validated successfully as the user is in the required group.",
            });
          }

        } else {
          //Just auto checking
          // Handle referral logic
          await handleReferralRewards(user, task.gold_reward);
          await user.save();

          // If user request validate, directly validate the task
          user.task_done.push({
            task_id,
            proof_img: "", // No proof image needed
            proof_url: url || "", // Optional proof URL
            completed_date: new Date(),
            validation_status: "validated", // Directly mark as validated
          });

          await user.save();

          return res.json({
            message: "Task validated successfully as the user checked task.",
          });
        }
      }
    } else {
      // Proof image handling for non-Telegram group tasks
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
          const filePath = path.join(
            __dirname,
            "../public/images",
            uniqueFileName
          );

          fs.writeFileSync(filePath, fileData.data);
          savedFilePath = `/images/${uniqueFileName}`;
        } catch (error) {
          return res.status(400).json({ message: "Invalid image format" });
        }
      }

      const existingTask = user.task_done.find(
        (task) => task.task_id.toString() === task_id
      );

      if (existingTask) {
        if (existingTask?.validation_status === "validated") {
          return res.json({
            message: "You have already done this task.",
          });
        } else {
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
        }
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
    }
  } catch (error) {
    console.error(error);
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

    const existingTask = user.task_done.find(
      (task) => task.task_id.toString() === task_id
    );

    // Check if the task status is already "validated" or "checked"
    if (
      existingTask &&
      (existingTask.validation_status === "validated" ||
        existingTask.validation_status === "checked")
    ) {
      return res.json({
        message: "The task has already been validated or checked.",
      });
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

    // Handle referral logic
    await handleReferralRewards(user, task.gold_reward);
    await user.save();

    res.json({
      message: "The task validation has been completed.",
      updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Remove Task from User's Task Status and Delete Proof Image
export const removingTaskfromUserTasksStatus = async (
  req: Request,
  res: Response
) => {
  const { telegram_id, task_id } = req.body;

  // Check if the task_id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(task_id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert task_id to ObjectId
    const objectIdTask = new mongoose.Types.ObjectId(task_id);
    // Find the task to remove
    const taskIndex = user.task_done.findIndex(
      (task) => task.task_id.toString() === objectIdTask.toString()
    );

    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found for this user" });
    }

    const taskToRemove = user.task_done[taskIndex];

    // If there's a proof image, remove it from the file system
    if (taskToRemove.proof_img) {
      const imagePath = path.join(
        __dirname,
        `../public${taskToRemove.proof_img}`
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Remove the task from the user's task_done array
    user.task_done.splice(taskIndex, 1);

    // Save the updated user document
    await user.save();

    res.json({
      message: "Task removed from user's task list, and proof image deleted.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, gold_reward, xp_reward, link, is_auto_check, group_bot_token, cashtag_for_username, is_limited } =
    req.body;
  const avatar_url = req.file ? `/images/${req.file.filename}` : undefined;

  try {
    const task = await Task.findByIdAndUpdate(
      id,
      {
        name,
        gold_reward,
        xp_reward,
        avatar_url,
        link,
        is_auto_check,
        is_limited: is_limited || false,
        group_bot_token: group_bot_token || null,
        cashtag_for_username: cashtag_for_username || null
      },
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

export const updateTaskOrder = async (req: Request, res: Response) => {
  const { orderedTaskIds } = req.body;
  if (!Array.isArray(orderedTaskIds) || orderedTaskIds.length === 0) {
    return res.status(400).json({ message: "Invalid task list" });
  }

  for (let i = 0; i < orderedTaskIds.length; i++) {
    if (!Types.ObjectId.isValid(orderedTaskIds[i])) {
      return res
        .status(400)
        .json({ message: `Invalid task ID: ${orderedTaskIds[i]}` });
    }
  }

  try {
    for (let i = 0; i < orderedTaskIds.length; i++) {
      const taskId = orderedTaskIds[i];
      await Task.findByIdAndUpdate(taskId, { order_index: i });
    }

    res.json({ message: "Tasks reordered successfully" });
  } catch (error: any) {
    console.error(error);
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
      }
    }

    res.json({ message: "Task removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const uploadAvatar = upload.single("avatar_url");
export const uploadImage = upload.single("image");
