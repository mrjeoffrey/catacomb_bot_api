import express from "express";
import {
  getUserInfo,
  openChest,
  getUsers,
  createUser,
  getUserById,
} from "../controllers/userController";

const router = express.Router();

router.get("/", getUsers);
router.post("/", createUser);
router.post("/info", getUserInfo);
router.post("/info_by_id", getUserById);
router.post("/open-chest", openChest);

export default router;
