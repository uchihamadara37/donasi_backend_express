import express from 'express';
import { login, refreshToken, register } from '../controllers/authControllers.js';

const router = express.Router();

router.post('/login', login);
router.post('/refreshToken', refreshToken);
router.post('/users', register);

export default router;