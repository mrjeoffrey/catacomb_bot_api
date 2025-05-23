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
  getRankingsInSpecificPeriod,
  getSeasonsList,
  downloadUsersWithMoreThan10ReferralsSameIP,
} from "../controllers/adminController";
import { authenticateTokenForAdmin } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/login", login);
router.delete("/remove-admin/:id", authenticateTokenForAdmin, removeAdmin);
router.post("/block-user", authenticateTokenForAdmin, blockUser);
router.post("/register-mod", authenticateTokenForAdmin, registerMod);
router.post("/rankings-period", authenticateTokenForAdmin, getRankingsInSpecificPeriod);
router.get("/season-list", authenticateTokenForAdmin, getSeasonsList)
router.get("/get-moderators", authenticateTokenForAdmin, getModerators);
router.post("/remove-chesthistory", authenticateTokenForAdmin, removeChestOpenedHistory);
router.post("/remove-user", authenticateTokenForAdmin, removeUser);
router.put("/edit-task", authenticateTokenForAdmin, editTask);
router.post("/insert-level", authenticateTokenForAdmin, insertLevel);
router.put("/update-level", authenticateTokenForAdmin, updateLevel);
router.get("/download-users-with-more-than-10-referrals-same-ip", downloadUsersWithMoreThan10ReferralsSameIP);

export default router;
