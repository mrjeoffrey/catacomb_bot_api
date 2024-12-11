import express from "express";
import {
  taskProofingOrder,
  createTask,
  getAllTasks,
  removeTask,
  updateTask,
  uploadAvatar,
  uploadImage,
  validateTask,
} from "../controllers/taskController";

const router = express.Router();
router.get("/", getAllTasks);
router.post("/create", uploadAvatar, createTask);
router.post("/proof-task", uploadImage, taskProofingOrder);
router.post("/validate", validateTask);
router.post("/:id", uploadAvatar, updateTask);
router.get("/:id", removeTask);

export default router;
