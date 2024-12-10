import express from "express";
import {
  createTask,
  getAllTasks,
  removeTask,
  updateTask,
  uploadAvatar,
} from "../controllers/taskController";

const router = express.Router();
router.get("/", getAllTasks);
router.put("/", uploadAvatar, createTask);
router.put("/:id", uploadAvatar, updateTask);
router.get("/:id", removeTask);

export default router;
