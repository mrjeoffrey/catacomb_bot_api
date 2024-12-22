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
  checkTask,
  removingTaskfromUserTasksStatus,
  updateTaskOrder,
} from "../controllers/taskController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();
router.get("/", getAllTasks);
router.post("/create", authenticateToken, uploadAvatar, createTask);
router.post("/proof-task", uploadImage, taskProofingOrder);
router.post("/validate", authenticateToken, validateTask);
router.post("/check", authenticateToken, checkTask);
router.post(
  "/remove_from_user",
  authenticateToken,
  removingTaskfromUserTasksStatus
);
router.post("/reorder_task", authenticateToken, updateTaskOrder);
router.post("/:id", authenticateToken, uploadAvatar, updateTask);

router.get("/:id", authenticateToken, removeTask);

export default router;
