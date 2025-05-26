import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const addTransaksi = async (req, res) => {
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
    }, {
      maxWait: 10000,
      timeout: 15000,
    });

    res.status(201).json({message: "Transaksi donasi berhasil! :backend", transaksi: result});
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
        pengirim: { select: { id: true, name: true, email: true } },
        penerima: { select: { id: true, name: true, email: true } },
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
        pengirim: { select: { id: true, name: true, email: true } },
        penerima: { select: { id: true, name: true, email: true } },
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

export const updateTransaksiById = async (req, res) => {
  // Ambil ID transaksi dari parameter URL
  // Misalnya, jika rute Anda adalah /transactions/:id
  const transaksiId = parseInt(req.params.id); // Pastikan ini dikonversi ke integer
  
  // Ambil pesanDonasi baru dari body request
  const { pesanDonasi } = req.body;

  // --- 1. Validasi Input ---
  if (isNaN(transaksiId)) {
    return res.status(400).json({ error: 'Invalid transaction ID provided.' });
  }

  if (pesanDonasi === undefined) {
    return res.status(400).json({ error: 'pesanDonasi field is required in the request body.' });
  }

  try {
    const updatedTransaksi = await prisma.transaksi.update({
      where: {
        id: transaksiId, // Kriteria pencarian berdasarkan ID
      },
      data: {
        pesanDonasi: pesanDonasi, // Hanya memperbarui field ini
      },
      select: {
        id: true,
        pengirim: { select: { id: true, name: true, email: true } },
        penerima: { select: { id: true, name: true, email: true } },
        jumlahDonasi: true,
        pesanDonasi: true,
        waktu: true,
      },
    });

    // --- 3. Kirim Respon Sukses ---
    res.status(200).json({
      message: 'Transaction message updated successfully',
      transaksi: updatedTransaksi,
    });

  } catch (error) {
    // --- 4. Penanganan Error ---
    console.error('Error updating transaction:', error);

    // Penanganan error spesifik dari Prisma jika record tidak ditemukan
    if (error.code === 'P2025') { // 'An operation failed because it depends on one or more records that were required but not found.'
      return res.status(404).json({ error: `Transaction with ID ${transaksiId} not found.` });
    }
    
    // Penanganan error umum lainnya
    res.status(500).json({ error: 'Failed to update transaction due to server error.' });
  }
};

export const deleteTransaksiById = async (req, res) => {
  // Ambil ID transaksi dari parameter URL
  // Misalnya, jika rute Anda adalah /transactions/:id
  const transaksiId = parseInt(req.params.id); // Pastikan ini dikonversi ke integer

  // --- 1. Validasi Input ---
  if (isNaN(transaksiId)) {
    return res.status(400).json({ error: 'Invalid transaction ID provided. ID must be a number.' });
  }

  try {
    // --- 2. Hapus Transaksi dari Database ---
    // Menggunakan prisma.transaksi.delete() untuk menghapus satu record
    const deletedTransaksi = await prisma.transaksi.delete({
      where: {
        id: transaksiId, // Kriteria penghapusan berdasarkan ID
      },
      // Anda bisa memilih field mana yang ingin dikembalikan dalam response
      select: {
        id: true,
        pengirimId: true,
        penerimaId: true,
        jumlahDonasi: true,
        pesanDonasi: true,
        waktu: true,
      },
    });

    // --- 3. Kirim Respon Sukses ---
    res.status(200).json({
      message: `Transaction with ID ${transaksiId} deleted successfully`,
      // transaksi: deletedTransaksi, // Mengembalikan objek yang dihapus
    });

  } catch (error) {
    // --- 4. Penanganan Error ---
    console.error('Error deleting transaction:', error);

    // Penanganan error spesifik dari Prisma jika record tidak ditemukan
    if (error.code === 'P2025') { // 'An operation failed because it depends on one or more records that were required but not found.'
      return res.status(404).json({ error: `Transaction with ID ${transaksiId} not found.` });
    }
    
    // Penanganan error umum lainnya
    res.status(500).json({ error: 'Failed to delete transaction due to server error.' });
  }
};