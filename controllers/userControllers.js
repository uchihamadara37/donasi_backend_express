// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

import prisma from '../utils/prisma.js';

// Get all users
export const getAllUser = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      saldo: true,
      // password tidak disertakan
    },
  });
  res.json(users);
};

// Get user by ID
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        // jangan sertakan password
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update User
export const updateUser = async (req, res) => {
  console.log('Update User Controller called');
  console.log('Request body:', req.body);
  const id = parseInt(req.params.id); // dapatkan id dari param URL
  const { name, email, password, saldo, amount, pin } = req.body; // data yang mau diupdate

  const currentUser = await prisma.user.findUnique({
    where: { id: id },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      avatar: true, 
      saldo: true, 
      pin: true 
    } // Pilih field yang relevan
  });
  if (!currentUser) {
    return res.status(404).json({ error: `User with ID ${userId} not found.` });
  }

  if (pin && currentUser.pin !== parseInt(pin)) {
    console.log('Pin tidak sesuai');
    return res.status(403).json({ error: 'Pin tidak sesuai' });
  }


  try {
    // Jika password ada, hash dulu
    let hashedPassword;
    if (password) {
      const bcrypt = await import('bcrypt');
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update user dengan data baru
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(password && { password: hashedPassword }),
        ...(saldo !== undefined && { saldo }), // saldo bisa 0, jadi jangan gunakan falsy check
        // ...(pin !== undefined && { pin: parseInt(pin) }), // pin bisa 0, jadi jangan gunakan falsy check
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        saldo: true,

        // jangan kirim password ke client
      },
    });
    console.log('User updated:', updatedUser);


    // const validJenis = ["PEMASUKAN", "PENGELUARAN"];
    // const validSumber = ["TOPUP", "PENARIKAN", "DONASI"];
    // // update history_saldo
    // const newHistory = await prisma.history.create({
    //   data: {
    //     userId: id,
    //     jumlah: amount,
    //     jenis: "PENGELUARAN", 
    //     sumber: "PENARIKAN",
    //     transaksiId: null,
    //     waktu: new Date(),
    //   },
    //   // Pilih field mana yang ingin dikembalikan dalam response
    //   select: {
    //     id: true,
    //     userId: true,
    //     jumlah: true,
    //     jenis: true,
    //     sumber: true,
    //     transaksiId: true,
    //     waktu: true,
    //   },
    // });


    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error; // lempar error ke middleware error handling

  }
};

// Delete User
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Cek apakah user ada di database
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2️⃣ Hapus refresh token yang terkait
    await prisma.refreshToken.deleteMany({
      where: {
        userId: Number(id)
      }
    });

    // 3️⃣ Hapus user
    await prisma.user.delete({
      where: { id: Number(id) }
    });

    res.status(200).json({ message: `User with id ${id} deleted successfully` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
