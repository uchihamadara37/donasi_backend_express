import express from 'express';
import { getAllUser} from '../controllers/userControllers.js';

const router = express.Router();

router.get('/users', getAllUser);

export default router;