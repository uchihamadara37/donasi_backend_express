import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const history = await prisma.history.findMany({
            where: { userId: parseInt(id) },
            orderBy: { waktu: "desc" },
            select: {
                id: true,
                jumlah: true,
                jenis: true,
                sumber: true,
                transaksiId: true,
                waktu: true,
            },
        });

        if (!history) {
            return res.status(404).json({ message: "Belum ada history untuk user", id });
        }

        res.status(200).json(history);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const addHistory = async (req, res) => {
  console.log('Add History Controller called');
  console.log('Request Body:', req.body);
  const { userId, jumlah, jenis, sumber, transaksiId } = req.body;

  if (!userId || !jumlah || !jenis || !sumber) {
    return res.status(400).json({ error: 'UserID, Jumlah, Jenis, and Sumber are required fields.' });
  }

  if (typeof jumlah !== 'number' || jumlah <= 0) {
    return res.status(400).json({ error: 'Jumlah must be a positive number.' });
  }

  const validJenis = ["PEMASUKAN", "PENGELUARAN"];
  const validSumber = ["TOPUP", "PENARIKAN", "DONASI"];

  if (!validJenis.includes(jenis)) {
    return res.status(400).json({ error: `Invalid 'jenis'. Must be one of: ${validJenis.join(', ')}` });
  }
  if (!validSumber.includes(sumber)) {
    return res.status(400).json({ error: `Invalid 'sumber'. Must be one of: ${validSumber.join(', ')}` });
  }

  try {
    const newHistory = await prisma.history.create({
      data: {
        userId: userId,
        jumlah: jumlah,
        jenis: jenis,
        sumber: sumber,
        transaksiId: transaksiId || null,
        waktu: new Date(),
      },
      // Pilih field mana yang ingin dikembalikan dalam response
      select: {
        id: true,
        userId: true,
        jumlah: true,
        jenis: true,
        sumber: true,
        transaksiId: true,
        waktu: true,
      },
    });

    // --- 3. Kirim Respon Sukses ---
    res.status(200).json({
      message: 'History added successfully',
      history: newHistory,
    });

  } catch (error) {
    console.error('Error adding history:', error);
    if (error.code === 'P2003') { // ForeignKeyConstraintViolation
      return res.status(404).json({ error: 'User not found for the given userId.' });
    }
    res.status(500).json({ error: 'Failed to add history due to server error.' });
  }
};

export const getHistoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const history = await prisma.history.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                jumlah: true,
                jenis: true,
                sumber: true,
                transaksiId: true,
                waktu: true,
            },
        });

        if (!history) {
            return res.status(404).json({ message: "History tidak ditemukan" });
        }

        res.status(200).json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};