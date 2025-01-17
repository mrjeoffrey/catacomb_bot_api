import express from "express";
import {
  getUserInfo,
  getUsersByPaginationAndFiltering,
  createUser,
  getUserById,
  getAllUsers,
} from "../controllers/userController";
import { openChest } from "../controllers/chestOpeningGameController";

const router = express.Router();

router.get("/", getUsersByPaginationAndFiltering);
router.get("/all", getAllUsers);
router.post("/", createUser);
router.post("/info", getUserInfo);
router.post("/info_by_id", getUserById);
router.post("/open-chest", openChest);

export default router;
