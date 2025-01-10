import express from "express";
import { getSettings } from "../controllers/settingsController";
import { updateSettings } from "../controllers/adminController";
import { authenticateTokenForAdmin } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", getSettings);
// Update Settings
router.put("/", authenticateTokenForAdmin, updateSettings);

export default router;
