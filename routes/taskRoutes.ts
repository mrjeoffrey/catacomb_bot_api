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
  getAllLimitedAndUnlimitedTasks,
} from "../controllers/taskController";
import { authenticateToken, authenticateTokenForAdmin } from "../middlewares/authMiddleware";

const router = express.Router();
router.get("/", getAllTasks);
router.get("/all",authenticateTokenForAdmin, getAllLimitedAndUnlimitedTasks);
router.post("/create", authenticateTokenForAdmin, uploadAvatar, createTask);
router.post("/proof-task", uploadImage, taskProofingOrder);
router.post("/validate", authenticateToken, validateTask);
router.post("/check", authenticateTokenForAdmin, checkTask);
router.post(
  "/remove_from_user",
  authenticateToken,
  removingTaskfromUserTasksStatus
);
router.post("/reorder_task", authenticateTokenForAdmin, updateTaskOrder);
router.post("/:id", authenticateTokenForAdmin, uploadAvatar, updateTask);

router.get("/:id", authenticateTokenForAdmin, removeTask);

export default router;
