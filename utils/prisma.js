// import { PrismaClient } from '@prisma/client'
// import { PrismaMariaDb } from '@prisma/adapter-mariadb'
// import mariadb from 'mariadb'
// import dotenv from 'dotenv'
// import fs from 'fs'
// import path from 'path'

// dotenv.config()

// if (!process.env.DB_HOST) {
//   throw new Error("Variabel DB_HOST kosong. Pastikan .env terbaca!")
// }

// // 1. Baca sertifikat Aiven persis seperti di skrip tes
// const certPath = path.resolve(process.cwd(), 'ca.pem')
// const caCert = fs.readFileSync(certPath)

// // 2. Gunakan pool yang SUDAH TERBUKTI BERHASIL
// const pool = mariadb.createPool({
//   host: process.env.DB_HOST,
//   port: parseInt(process.env.DB_PORT, 10),
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   ssl: {
//     ca: caCert, // Wajib ada
//     rejectUnauthorized: true // Wajib true
//   },
//   connectTimeout: 10000 
// })

// // 3. Bungkus dengan Prisma
// const adapter = new PrismaMariaDb(pool)
// const prisma = new PrismaClient({ adapter })

// export default prisma

import { PrismaClient } from '@prisma/client';

// Prisma Client otomatis membaca DATABASE_URL dari .env dan menangani SSL sendiri
const prisma = new PrismaClient();

export default prisma;