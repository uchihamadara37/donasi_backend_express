import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const donasi = async (req, res) => {
  try {
    const { pengirimId, penerimaId, jumlahDonasi, pesanDonasi } = req.body;

    if (pengirimId == penerimaId) {
      return res
        .status(400)
        .json({ message: "Tidak dapat berdonasi ke diri sendiri!" });
    }

    if (jumlahDonasi <= 0) {
      return res.status(400).json({ message: "Jumlah donasi tidak valid!" });
    }

    const pengirim = await prisma.user.findUnique({
      where: { id: pengirimId },
    });
    const penerima = await prisma.user.findUnique({
      where: { id: penerimaId },
    });

    if (!pengirim || !penerima) {
      return res
        .status(400)
        .json({ message: "Pengirim atau Penerima tidak ditemukan!" });
    }

    if (pengirim.saldo < jumlahDonasi) {
      return res.status(400).json({ message: "Saldo pengirim tidak cukup!" });
    }

    // mulai transaksi
    const result = await prisma.$transaction(async (tx) => {
      // membuat transaksi
      const transaksi = await tx.transaksi.create({
        data: {
          pengirimId,
          penerimaId,
          jumlahDonasi,
          pesanDonasi,
        },
      });

      // update saldo
      await tx.user.update({
        where: { id: pengirimId },
        data: { saldo: { decrement: jumlahDonasi } },
      });

      await tx.user.update({
        where: { id: penerimaId },
        data: { saldo: { increment: jumlahDonasi } },
      });

      //membuat history pengirim
      await tx.history.create({
        data: {
          userId: pengirimId,
          jumlah: jumlahDonasi,
          jenis: "PENGELUARAN",
          sumber: "DONASI",
          transaksiId: transaksi.id,
        },
      });

      // membuat history penerima
      await tx.history.create({
        data: {
          userId: penerimaId,
          jumlah: jumlahDonasi,
          jenis: "PEMASUKAN",
          sumber: "DONASI",
          transaksiId: transaksi.id,
        },
      });

      return transaksi;
    });

    res.status(201).json({message: "Donasi berhasil!", transaksi: result});
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Terjadi kesalahan saat donasi!"});
  }
};

export const getAllTransaksi = async (req, res) => {
  try {
    const transaksi = await prisma.transaksi.findMany({
      select: {
        id: true,
        pengirim: { select: { id: true, name: true } },
        penerima: { select: { id: true, name: true } },
        jumlahDonasi: true,
        pesanDonasi: true,
        waktu: true
      }
    });
    res.status(200).json(transaksi);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Terjadi kesalahan server!"});
  }
};

export const getTransaksibyId = async (req, res) => {
  const { id } = req.params;
  try {
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        pengirim: { select: { id: true, name: true } },
        penerima: { select: { id: true, name: true } },
        jumlahDonasi: true,
        pesanDonasi: true,
        waktu: true
      }
    });

    if (!transaksi) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    res.status(200).json(transaksi);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Terjadi kesalahan server!"});
  }
};