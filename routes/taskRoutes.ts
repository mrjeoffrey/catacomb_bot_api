import express from "express";
import {
  createTask,
  getAllTasks,
  removeTask,
  updateTask,
} from "../controllers/taskController";

const router = express.Router();

router.get("/", getAllTasks);
router.put("/create", createTask);
router.put("/:id", updateTask);
router.get("/:id", removeTask);
// Get Task by ID
// router.get('/tasks/:id', getTaskById);

module.exports = router;

export default router;
