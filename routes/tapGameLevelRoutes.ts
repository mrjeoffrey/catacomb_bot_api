import express from "express";

import { authenticateTokenForAdmin } from "../middlewares/authMiddleware";
import { createTapGameLevel, deleteTapGameLevel, getAllTapGameLevels, getTapGameLevelById, updateTapGameLevel, uploadImage } from "../controllers/tapGameLevelController";

const router = express.Router();
router.get("/", getAllTapGameLevels);
router.post("/create", authenticateTokenForAdmin, uploadImage, createTapGameLevel);
router.post("/:id", authenticateTokenForAdmin, uploadImage, updateTapGameLevel);

router.get("/delete/:id", authenticateTokenForAdmin, deleteTapGameLevel);
router.get("/:id", authenticateTokenForAdmin, getTapGameLevelById);


export default router;
