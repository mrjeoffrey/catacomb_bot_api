import express from "express";
import {
  getUserInfo,
  openChest,
  getUsersByPaginationAndFiltering,
  createUser,
  getUserById,
  getAllUsers,
} from "../controllers/userController";

const router = express.Router();

router.get("/", getUsersByPaginationAndFiltering);
router.get("/all", getAllUsers);
router.post("/", createUser);
router.post("/info", getUserInfo);
router.post("/info_by_id", getUserById);
router.post("/open-chest", openChest);

export default router;
