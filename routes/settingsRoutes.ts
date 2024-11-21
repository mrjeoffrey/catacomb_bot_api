import express from 'express';
import { getSettings } from '../controllers/settingsController';

const router = express.Router();

router.get('/', getSettings);

export default router;
