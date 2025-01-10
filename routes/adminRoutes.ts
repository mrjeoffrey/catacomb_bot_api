import express from "express";
import {
  registerAdmin,
  login,
  blockUser,
  editTask,
  insertLevel,
  updateLevel,
  removeUser,
  removeChestOpenedHistory,
  registerMod,
  getModerators,
  removeAdmin,
} from "../controllers/adminController";
import { authenticateTokenForAdmin } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/login", login);
router.delete("/remove-admin", authenticateTokenForAdmin, removeAdmin);
router.post("/block-user", authenticateTokenForAdmin, blockUser);
router.post("/register-mod", authenticateTokenForAdmin, registerMod);
router.get("/get-moderators", authenticateTokenForAdmin, getModerators);
router.post("/remove-chesthistory", authenticateTokenForAdmin, removeChestOpenedHistory);
router.post("/remove-user", authenticateTokenForAdmin, removeUser);
router.put("/edit-task", authenticateTokenForAdmin, editTask);
router.post("/insert-level", authenticateTokenForAdmin, insertLevel);
router.put("/update-level", authenticateTokenForAdmin, updateLevel);

export default router;
