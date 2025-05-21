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