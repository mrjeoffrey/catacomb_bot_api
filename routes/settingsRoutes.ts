import express from "express";
import { getPublicSettings, getSettings, updateCurrencySettings, updateSeasonPrizes, uploadCurrencyImage } from "../controllers/settingsController";
import { updateSettings } from "../controllers/adminController";
import { authenticateTokenForAdmin } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/",authenticateTokenForAdmin, getSettings);
router.get("/public", getPublicSettings);
// Update Settings
router.put("/", authenticateTokenForAdmin, updateSettings);
router.post("/currency", authenticateTokenForAdmin, uploadCurrencyImage, updateCurrencySettings);
router.post("/prizes", authenticateTokenForAdmin, updateSeasonPrizes);

export default router;
