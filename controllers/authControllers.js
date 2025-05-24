import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { uploadFileToGCS } from '../utils/gcs.js';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Auth Register
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const avatarFile = req.file; // Multer akan menambahkan file yang diunggah ke req.file



  if (!name || !email || !password) {
    return res.status(400).json({ error: 'There is something necessary field empty' });
  }

  // 1️⃣ Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  let avatarUrl = null; // Inisialisasi URL avatar
  if (avatarFile) {
    try {
      // Unggah avatar ke GCS jika file ada
      avatarUrl = await uploadFileToGCS(avatarFile.buffer, avatarFile.originalname, avatarFile.mimetype);
      console.log('Avatar uploaded to GCS:', avatarUrl);
    } catch (uploadError) {
      console.error('Failed to upload avatar to GCS:', uploadError);
      // Jika upload avatar gagal, kembalikan error ke klien
      return res.status(500).json({ error: 'Failed to upload avatar image' });
    }
  }

  // 2️⃣ Hash password
  const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

  // 3️⃣ Create new user with hashed password
  const newUser = await prisma.user.create({
    data: { 
      name, 
      email, 
      password: hashedPassword, 
      avatar: avatarUrl 
    }
  });

  // 4️⃣ Generate access token
  const accessToken = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatarUrl: newUser.avatarUrl
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' } // atau sesukamu
  );

  // 5️⃣ Generate refresh token
  const refreshToken = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatarUrl: newUser.avatarUrl
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // 6️⃣ Simpan refresh token ke database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: newUser.id,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 hari dari sekarang
    }
  });

  res.status(201).json({
    message: 'User registered successfully',
    user: newUser,
    accessToken,
    refreshToken
  });
};

// Auth login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Cek apakah user ada
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Email not found' });
    }

    // 2️⃣ Cek password-nya
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // 3️⃣ Generate access token
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    // 4️⃣ Generate refresh token
    const refreshToken = jwt.sign( 
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // 5️⃣ Simpan refresh token ke database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 hari
      }
    });

    // 6️⃣ Return token ke client
    res.json({
      message: 'Login successful',
      user,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// refreshToken untuk mendapat accessToken baru jika accessToken lama expired
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    // 1️⃣ Cek apakah token ada di database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!storedToken) return res.status(401).json({ error: 'Invalid refresh token' });

    // 2️⃣ Cek expired atau belum
    if (new Date() > storedToken.expiredAt) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // 3️⃣ Verifikasi refresh token-nya
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
      if (err) return res.status(401).json({ error: 'Invalid refresh token' });

      // 4️⃣ Generate access token baru
      const newAccessToken = jwt.sign(
        {
          id: payload.id,
          name: payload.name,
          email: payload.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      );

      res.status(200).json({
        accessToken: newAccessToken,
        message: "Token berhasil di-refresh"
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
