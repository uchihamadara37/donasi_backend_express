-- AlterTable
ALTER TABLE `user` ADD COLUMN `saldo` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Transaksi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pengirimId` INTEGER NOT NULL,
    `penerimaId` INTEGER NOT NULL,
    `jumlahDonasi` INTEGER NOT NULL,
    `pesanDonasi` VARCHAR(191) NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `History` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `jenis` ENUM('PEMASUKAN', 'PENGELUARAN') NOT NULL,
    `sumber` ENUM('TOPUP', 'PENARIKAN', 'DONASI') NOT NULL,
    `transaksiId` INTEGER NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaksi` ADD CONSTRAINT `Transaksi_pengirimId_fkey` FOREIGN KEY (`pengirimId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaksi` ADD CONSTRAINT `Transaksi_penerimaId_fkey` FOREIGN KEY (`penerimaId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `History` ADD CONSTRAINT `History_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `History` ADD CONSTRAINT `History_transaksiId_fkey` FOREIGN KEY (`transaksiId`) REFERENCES `Transaksi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
