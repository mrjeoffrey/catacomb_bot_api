import express from "express";
import {
  getAllLevels,
  createLevel,
  updateLevel,
  removeLevel,
} from "../controllers/levelController";
import { authenticateTokenForAdmin } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", getAllLevels);
router.post("/", authenticateTokenForAdmin, createLevel);
router.put("/:id", authenticateTokenForAdmin, updateLevel);
router.delete("/:id", authenticateTokenForAdmin, removeLevel);

export default router;
