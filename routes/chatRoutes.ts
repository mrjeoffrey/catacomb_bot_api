import { Router } from "express";
import { getChatHistory, getBotToUserChatHistory, getUserToBotChatHistory, sendTelegramMessage, saveChatMessage } from "../controllers/chatController";
import { authenticateTokenForAdmin } from "../middlewares/authMiddleware";

const router = Router();

router.post("/send",authenticateTokenForAdmin, async (req, res) => {
  const { telegram_id, message } = req.body;
  try {
    const response = await sendTelegramMessage(telegram_id, message);
    await saveChatMessage(telegram_id, message);
    res.status(200).json({ message: "Message sent and saved successfully", response });
  } catch (error) {
    res.status(500).json({ message: "Error sending or saving message", error });
  }
});

router.get("/:telegram_id",authenticateTokenForAdmin, getChatHistory);
router.get("/bot-to-user/:telegram_id",authenticateTokenForAdmin, getBotToUserChatHistory);
router.get("/user-to-bot/:telegram_id",authenticateTokenForAdmin, getUserToBotChatHistory);

export default router;
