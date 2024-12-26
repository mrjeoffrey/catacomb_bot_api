import express from "express";
import {
  registerAdmin,
  loginAdmin,
  blockUser,
  editTask,
  insertLevel,
  updateLevel,
  removeUser,
  removeChestOpenedHistory,
} from "../controllers/adminController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/block-user", authenticateToken, blockUser);
router.post("/remove-chesthistory", authenticateToken, removeChestOpenedHistory);
router.post("/remove-user", authenticateToken, removeUser);
router.put("/edit-task", authenticateToken, editTask);
router.post("/insert-level", authenticateToken, insertLevel);
router.put("/update-level", authenticateToken, updateLevel);

export default router;
