import express from "express";

import { authenticateTokenForAdmin } from "../middlewares/authMiddleware";
import {
  checkAdTicketClaimable,
  claimAdsgramTicket,
  claimDailyTicket,
  createTapGameLevel,
  deleteTapGameLevel,
  getAllTapGameLevels,
  getTapGameLevelById,
  gettingTicketInfo,
  tappingPyramid,
  ticketToTaps,
  updateTapGameLevel,
  uploadImage,
} from "../controllers/tapGameController";

const router = express.Router();
router.get("/level", getAllTapGameLevels);
router.post(
  "/level/create",
  authenticateTokenForAdmin,
  uploadImage,
  createTapGameLevel
);
router.post(
  "/level/:id",
  authenticateTokenForAdmin,
  uploadImage,
  updateTapGameLevel
);
router.get("/level/delete/:id", authenticateTokenForAdmin, deleteTapGameLevel);
router.get("/level/:id", authenticateTokenForAdmin, getTapGameLevelById);

router.post("/getting_ticket_info", gettingTicketInfo);
router.post("/claim_daily_ticket", claimDailyTicket);

router.post("/check_adticket_claimable", checkAdTicketClaimable);
router.post("/claim_adsgram_ticket", claimAdsgramTicket);

router.post("/ticket_to_taps", ticketToTaps);

router.post("/tapping-pyramid", tappingPyramid);

export default router;
