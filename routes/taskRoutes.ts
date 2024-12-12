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
} from "../controllers/taskController";

const router = express.Router();
router.get("/", getAllTasks);
router.post("/create", uploadAvatar, createTask);
router.post("/proof-task", uploadImage, taskProofingOrder);
router.post("/validate", validateTask);
router.post("/check", checkTask);
router.post("/remove_from_user", removingTaskfromUserTasksStatus);
router.post("/:id", uploadAvatar, updateTask);
router.get("/:id", removeTask);

export default router;
