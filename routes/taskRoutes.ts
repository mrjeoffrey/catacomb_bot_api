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
router.post("/", uploadAvatar, createTask);
router.post("/:id", uploadAvatar, updateTask);
router.get("/:id", removeTask);

export default router;
