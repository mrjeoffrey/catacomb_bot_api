import express from "express";
import { getSettings } from "../controllers/settingsController";
import { updateSettings } from "../controllers/adminController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", getSettings);
// Update Settings
router.put("/", authenticateToken, updateSettings);

export default router;
