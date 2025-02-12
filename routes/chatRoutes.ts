import { Router } from "express";
import { getChatHistory, sendPrivateMessage, sendMassMessage } from "../controllers/chatController";
import { authenticateTokenForAdmin } from "../middlewares/authMiddleware";

const router = Router();

router.post("/send", authenticateTokenForAdmin, sendPrivateMessage);

router.post("/mass-send", authenticateTokenForAdmin, sendMassMessage);

router.get("/:telegram_id", authenticateTokenForAdmin, getChatHistory);

export default router;
