import express from "express";
import { getSettings } from "../controllers/settingsController";
import { updateSettings } from "../controllers/adminController";

const router = express.Router();

router.get("/", getSettings);
// Update Settings
router.put("/", updateSettings);

export default router;
