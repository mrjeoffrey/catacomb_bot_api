import express from "express";
import {
  registerAdmin,
  loginAdmin,
  blockUser,
  editTask,
  updateSettings,
  insertLevel,
  updateLevel,
  removeUser,
} from "../controllers/adminController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/block-user", authenticateToken, blockUser);
router.post("/remove-user", removeUser);
router.put("/edit-task", authenticateToken, editTask);
router.put("/update-settings", authenticateToken, updateSettings);
router.post("/insert-level", authenticateToken, insertLevel);
router.put("/update-level", authenticateToken, updateLevel);

export default router;
