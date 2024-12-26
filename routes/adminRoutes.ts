import express from "express";
import {
  registerAdmin,
  loginAdmin,
  blockUser,
  editTask,
  // updateSettings,
  insertLevel,
  updateLevel,
  removeUser,
  removeChestOpenedHistory,
} from "../controllers/adminController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

// router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/block-user", authenticateToken, blockUser);
router.post("/remove-chesthistory", authenticateToken, removeChestOpenedHistory);
router.post("/remove-user", authenticateToken, removeUser);
router.put("/edit-task", authenticateToken, editTask);
// router.put("/update-settings", authenticateToken, updateSettings);
router.post("/insert-level", authenticateToken, insertLevel);
router.put("/update-level", authenticateToken, updateLevel);

export default router;
