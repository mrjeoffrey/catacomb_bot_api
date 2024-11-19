import { Router } from "express";
import { getUserById } from "../controllers/userController";

const router: Router = Router();

router.get("/:id", getUserById);

export default router;
