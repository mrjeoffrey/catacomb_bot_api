import express from "express";
import {
  getAllLevels,
  createLevel,
  updateLevel,
  removeLevel,
} from "../controllers/levelController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", getAllLevels);
router.post("/", authenticateToken, createLevel);
router.put("/:id", authenticateToken, updateLevel);
router.delete("/:id", authenticateToken, removeLevel);

export default router;
