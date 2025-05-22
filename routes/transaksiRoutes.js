import express from "express";
import { verifyToken } from "../middleware/verfyToken.js";
import { donasi, getAllTransaksi, getTransaksibyId } from "../controllers/transaksiControllers.js";

const router = express.Router();

router.post('/donasi', verifyToken, donasi);
router.get('/transaksi', verifyToken, getAllTransaksi);
router.get('/transaksi/:id', verifyToken, getTransaksibyId);

export default router;