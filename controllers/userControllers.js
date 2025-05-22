import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all users
export const getAllUser = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
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
  const { id } = req.params; // dapatkan id dari param URL
  const { name, email, password } = req.body; // data yang mau diupdate

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
      },
      select: {
        id: true,
        name: true,
        email: true,
        // jangan kirim password ke client
      },
    });

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error(error);
    // Jika user dengan id tidak ada, Prisma akan error, tangani di sini:
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
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
