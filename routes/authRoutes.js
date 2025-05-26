import express from 'express';
import { editUserNameAndAvatar, login, logout, refreshToken, register } from '../controllers/authControllers.js';
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
router.post('/register', upload.single("avatar"), register);
router.put('/editProfile/:id', upload.single("avatar"), editUserNameAndAvatar); // Menggunakan register untuk update profile
router.post("/logout", logout);

export default router;