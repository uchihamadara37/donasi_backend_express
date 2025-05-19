import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all users
export const getAllUser = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};