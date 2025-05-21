import express from 'express';
import { verifyToken } from '../middleware/verfyToken.js';
import { getHistory, getHistoryById } from '../controllers/historyControllers.js';

const router = express.Router();

router.get('/history/:id', verifyToken, getHistory);
router.get('/history/detail/:id', verifyToken, getHistoryById);

export default router;