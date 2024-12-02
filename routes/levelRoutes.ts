import express from "express";
import {
  getAllLevels,
  createLevel,
  updateLevel,
  removeLevel,
} from "../controllers/levelController";

const router = express.Router();

router.get("/", getAllLevels); // Get all levels
router.post("/", createLevel); // Create a level
router.put("/:id", updateLevel); // Update a level by ID
router.delete("/:id", removeLevel); // Delete a level by ID

export default router;
