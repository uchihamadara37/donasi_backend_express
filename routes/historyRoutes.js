import express from 'express';
import { verifyToken } from '../middleware/verfyToken.js';
import { addHistory, getHistory, getHistoryById } from '../controllers/historyControllers.js';

const router = express.Router();

router.post('/history', verifyToken, addHistory);
router.get('/history/:id', verifyToken, getHistory);
router.get('/history/detail/:id', verifyToken, getHistoryById);

export default router;