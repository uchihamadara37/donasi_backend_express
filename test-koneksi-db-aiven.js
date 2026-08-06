import mariadb from 'mariadb'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// Baca sertifikat Aiven
const certPath = path.resolve(process.cwd(), 'ca.pem')
const caCert = fs.readFileSync(certPath)

// Konfigurasi pool murni tanpa Prisma
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: caCert,
    rejectUnauthorized: true 
  },
  connectTimeout: 10000 
})

async function testConnection() {
  console.log("Mencoba mengetuk pintu Aiven...");
  try {
    // Meminta 1 koneksi langsung dari pool
    const conn = await pool.getConnection();
    console.log("✅ BERHASIL CONNECT! Aiven membukakan pintu.");
    
    // Test query sederhana
    const rows = await conn.query("SELECT 1 as test_val");
    console.log("✅ Query Berhasil:", rows);
    
    // Tutup koneksi agar tidak menggantung
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error("❌ KONEKSI GAGAL! Ini adalah error aslinya dari driver MariaDB:");
    console.error(err);
    process.exit(1);
  }
}

testConnection();