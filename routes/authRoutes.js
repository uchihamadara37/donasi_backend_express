import express from 'express';
import { login, refreshToken, register } from '../controllers/authControllers.js';
import multer from 'multer';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file 5MB (sesuaikan)
  fileFilter: (req, file, cb) => {
    // Filter hanya mengizinkan file gambar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post('/login', login);
router.post('/refreshToken', refreshToken);
router.post('/auth', upload.single("avatar"), register);

export default router;