import express from "express";
import {
  getUserInfo,
  completeTask,
  openChest,
  refer,
  getUsers,
} from "../controllers/userController";

const router = express.Router();

router.get("/", getUsers);
router.get("/info", getUserInfo);
router.post("/complete-task", completeTask);
router.post("/open-chest", openChest);
router.post("/refer", refer);

export default router;
