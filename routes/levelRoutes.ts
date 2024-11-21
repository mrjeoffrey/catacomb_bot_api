import express from 'express';
import { getLevelInfo } from '../controllers/levelController';

const router = express.Router();

router.get('/', getLevelInfo);

export default router;
