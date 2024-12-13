import express from "express";
import { logging } from "../controllers/logController";

const router = express.Router();

router.post("/", logging);

export default router;
