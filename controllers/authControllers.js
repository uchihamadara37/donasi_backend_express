import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// import { uploadFileToGCS } from '../utils/gcs.js';

// import { PrismaClient } from '@prisma/client';
import path from 'path';
import prisma from '../utils/prisma.js';
import { uploadImage } from '../utils/supabseStorage.js';
// const prisma = new PrismaClient();

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
      avatarUrl = await uploadImage(avatarFile.buffer, avatarFile.originalname, avatarFile.mimetype);
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
      avatar: avatarUrl,
      saldo: 0 // Atau nilai default lainnya
    }
  });

  // 4️⃣ Generate access token
  const accessToken = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatarUrl
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
      avatar: newUser.avatarUrl
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

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true, // true di produksi (HTTPS)
    sameSite: 'None', // Atau 'Lax' tergantung kebutuhan
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari dalam ms
    path: '/' 
  });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      saldo: newUser.saldo,
      pin: true
    },
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
      return res.status(400).json({ error: 'Email not found in backend' });
    }

    // 2️⃣ Cek password-nya
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password in backend' });
    }

    // 3️⃣ Generate access token
    const accessToken = jwt.sign(
      {
        id    : user.id,
        email : user.email,
        name  : user.name,
        avatar: user.avatarUrl
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    // 4️⃣ Generate refresh token
    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatarUrl
      },
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

    res.cookie('refreshToken', refreshToken, {  // untuk memerintahkan browser menyimpan data token
      httpOnly: true,
      secure: true, 
      sameSite: 'none',     
      maxAge: 7 * 24 * 60 * 60 * 1000, 
      path: '/' 
    });

    // 6️⃣ Return token ke client
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        saldo: user.saldo,
        pin: true
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// backend/controllers/authController.js (untuk logout)
export const logout = async (req, res) => {
  const refreshTokenCookie = req.cookies.refreshToken;

  if (!refreshTokenCookie) {
    return res.status(200).json({ message: 'No refresh token to clear in logout backend' });
  }

  try {
    // Hapus refresh token dari database
    await prisma.refreshToken.deleteMany({
      where: { token: refreshTokenCookie }
    });

    // Hapus cookie refresh token dari browser
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None'
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error("Error during logout:", error);
    // Tetap hapus cookie meskipun ada error DB untuk memastikan logout di client
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });
    res.status(500).json({ message: 'Error during logout' });
  }
};

// refreshToken untuk mendapat accessToken baru jika accessToken lama expired
export const refreshToken = async (req, res) => {
  const refreshTokenCookie = req.cookies.refreshToken; // Pastikan Anda menggunakan cookie-parser middleware

  if (!refreshTokenCookie) {
    return res.status(401).json({ message: 'Refresh token not found in backend' });
  }

  try {
    // 1. Verifikasi Refresh Token dari cookie
    const decoded = jwt.verify(refreshTokenCookie, process.env.REFRESH_TOKEN_SECRET);

    // 2. Cek apakah refresh token ada di database dan belum kedaluwarsa
    const storedRefreshToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshTokenCookie,
        userId: decoded.id, // Pastikan id pengguna ada di payload
        expiredAt: {
          gt: new Date() // Pastikan belum kedaluwarsa
        }
      }
    });

    if (!storedRefreshToken) {
      // Refresh token tidak valid atau sudah kedaluwarsa
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // 3. Ambil data user dari database (lebih aman dan up-to-date)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, avatar: true, saldo: true, pin: true } // Pilih field yang ingin Anda kirim ke frontend
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 4. Buat Access Token baru
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar // Sertakan avatar di token baru
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    // 5. Kirim Access Token baru dan data user
    res.status(200).json({
      accessToken: newAccessToken,
      user: user // Kirim data user ke frontend
    });

  } catch (error) {
    console.error("Error refreshing token:", error);
    // Hapus cookie jika verifikasi gagal (token rusak/invalid signature)
    res.clearCookie('refreshToken');
    return res.status(401).json({ message: 'Invalid token or server error' });
  }
};

export const editUserNameAndAvatar = async (req, res) => {
  console.log('Request to edit user profile received', req.body, req.file);
  // Ambil ID pengguna dari parameter URL
  // Misalnya, jika rute Anda adalah /users/:id
  const userId = parseInt(req.params.id); // Pastikan ini dikonversi ke integer

  // Ambil field yang mungkin diupdate dari body request
  const { name } = req.body; // Nama baru (opsional)
  const { currentPin, newPin, confirmNewPin } = req.body; // Pin baru (opsional, jika ingin update pin)
  const avatarFile = req.file; // File avatar baru dari Multer (opsional)

  // const currentPinInt = parseInt(currentPinStr, 10);
  // const newPinInt = parseInt(newPinStr, 10);
  // const confirmNewPinInt = parseInt(confirmNewPinStr, 10);

  console.log('Parsed values:', { userId, name, currentPin, newPin, confirmNewPin });

  
  // --- 1. Validasi Input ---
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID provided. ID must be a number.' });
  }

  // validasi pin baru
  if (newPin && newPin != confirmNewPin) {
    return res.status(400).json({ error: 'New PIN and confirmation PIN do not match.' });
  }



  // // Jika tidak ada nama baru dan tidak ada file avatar baru, tidak ada yang perlu diupdate
  // if (!name && !avatarFile) {
  //   return res.status(400).json({ error: 'No data provided for update (name or avatar).' });
  // }

  let avatarUrl = null; // Inisialisasi URL avatar baru

  try {
    // --- 2. Cari Pengguna Saat Ini ---
    // Kita perlu data pengguna saat ini untuk mendapatkan avatar lama jika ada
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatar: true, saldo: true, pin: true } // Pilih field yang relevan
    });

    
    if (!currentUser) {
      return res.status(404).json({ error: `User with ID ${userId} not found.` });
    }
    //validasi currentPin jika ingin update pin
    if (currentUser.pin && currentPin && parseInt(currentPin) !== currentUser.pin) {
      return res.status(400).json({ error: 'Current PIN is incorrect.' });
    }
      
    // --- 3. Unggah Avatar Baru (Jika Disediakan) ---
    if (avatarFile) {
      try {
        // Unggah file baru ke GCS
        avatarUrl = await uploadFileToGCS(avatarFile.buffer, avatarFile.originalname, avatarFile.mimetype);
        console.log('New avatar uploaded to GCS:', avatarUrl);

        // Opsional: Hapus avatar lama dari GCS
        // Ini adalah praktik baik untuk menghemat ruang dan menghindari file yatim piatu
        if (currentUser.avatar) {
          try {
            // Asumsi deleteFileFromGCS mengambil URL atau nama file
            await deleteFileFromGCS(currentUser.avatar);
            console.log('Old avatar deleted from GCS:', currentUser.avatar);
          } catch (deleteError) {
            console.warn('Failed to delete old avatar from GCS:', deleteError);
          }
        }
      } catch (uploadError) {
        console.error('Failed to upload new avatar to GCS:', uploadError);
        return res.status(500).json({ error: 'Failed to upload new avatar image.' });
      }
    }

    // --- 4. Siapkan Data untuk Update ---
    const updateData = {};
    if (name) {
      updateData.name = name;
    }
    if (newPin) {
      updateData.pin = parseInt(newPin, 10); // Simpan pin baru yang sudah di-hash
    }
    if (avatarFile) { // Jika ada file baru, gunakan URL yang baru diunggah
      updateData.avatar = avatarUrl;
    } else if (req.body.clearAvatar === 'true') { // Opsi untuk menghapus avatar tanpa mengunggah yang baru
      updateData.avatar = null;
      // Opsional: Hapus avatar lama dari GCS jika dikosongkan
      if (currentUser.avatar) {
        try {
          await deleteFileFromGCS(currentUser.avatar);
          console.log('Avatar cleared and old avatar deleted from GCS:', currentUser.avatar);
        } catch (deleteError) {
          console.warn('Failed to delete old avatar during clear:', deleteError);
        }
      }
    }

    console.log('Update data prepared:', updateData);
    // --- 5. Perbarui Pengguna di Database ---
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        saldo: true, // Sertakan saldo jika ingin dikembalikan
        pin: true // Sertakan pin jika ingin dikembalikan
      },
    });

    // --- 6. Kirim Respon Sukses ---
    res.status(200).json({
      message: 'User profile updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    // --- 7. Penanganan Error ---
    console.error('Error updating user profile:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: `User with ID ${userId} not found.` });
    }
    res.status(500).json({ error: 'Failed to update user profile due to server error.' });
  }
};
