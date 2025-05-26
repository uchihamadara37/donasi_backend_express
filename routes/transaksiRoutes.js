import express from "express";
import { verifyToken } from "../middleware/verfyToken.js";
import { addTransaksi, deleteTransaksiById, getAllTransaksi, getTransaksibyId, updateTransaksiById } from "../controllers/transaksiControllers.js";

const router = express.Router();

router.post('/transaksi', verifyToken, addTransaksi);
router.get('/transaksi', verifyToken, getAllTransaksi);
router.get('/transaksi/:id', verifyToken, getTransaksibyId);
router.put('/transaksi/:id', verifyToken, updateTransaksiById);
router.delete('/transaksi/:id', verifyToken, deleteTransaksiById);

export default router;