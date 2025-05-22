import express from 'express';
import { verifyToken } from '../middleware/verfyToken.js';
import { getAllUser, getUserById, updateUser, deleteUser } from '../controllers/userControllers.js';

const router = express.Router();

router.get('/users', verifyToken, getAllUser);
router.get('/users/:id', verifyToken, getUserById);
router.put('/users/:id', verifyToken, updateUser);
router.delete('/users/:id', verifyToken, deleteUser);

export default router;