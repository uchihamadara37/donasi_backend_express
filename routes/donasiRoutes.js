import express from "express";
import { verifyToken } from "../middleware/verfyToken.js";
import { donasi } from "../controllers/donasiControllers.js";

const router = express.Router();

router.post('/donasi', verifyToken, donasi);

export default router;