import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL atau SUPABASE_KEY belum dikonfigurasi di file .env");
}

// Inisialisasi Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

// Nama bucket tempat menyimpan gambar (pastikan sudah dibuat di dashboard Supabase)
const BUCKET_NAME = 'donasi-app'; 

/**
 * Mengunggah gambar ke Supabase Storage
 * @param {Buffer} fileBuffer - Buffer dari file gambar (misal dari req.file.buffer)
 * @param {string} fileName - Nama file yang unik (beserta ekstensinya)
 * @param {string} mimeType - Tipe konten (misal: 'image/jpeg')
 * @returns {Promise<string>} URL publik dari gambar yang diunggah
 */
export const uploadImage = async (fileBuffer, fileName, mimeType) => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: true, // Akan menimpa jika nama file sudah ada
    });

  if (error) {
    throw new Error(`Gagal mengunggah gambar: ${error.message}`);
  }

  // Mengambil URL publik agar bisa disimpan ke database (misal ke field 'avatar')
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

/**
 * Mengecek apakah sebuah gambar eksis di Supabase Storage
 * @param {string} fileName - Nama file yang ingin dicek
 * @returns {Promise<boolean>} True jika ada, False jika tidak
 */
export const checkImage = async (fileName) => {
  // Mencari file dengan nama yang spesifik di dalam bucket
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', {
      limit: 1,
      search: fileName,
    });

  if (error) {
    throw new Error(`Gagal mengecek gambar: ${error.message}`);
  }

  // Jika array data memiliki isi dan namanya cocok, berarti file eksis
  return data && data.length > 0 && data[0].name === fileName;
};

/**
 * Menghapus gambar dari Supabase Storage
 * @param {string} fileName - Nama file yang ingin dihapus
 * @returns {Promise<boolean>} Status keberhasilan penghapusan
 */
export const deleteImage = async (fileName) => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([fileName]);

  if (error) {
    throw new Error(`Gagal menghapus gambar: ${error.message}`);
  }

  return true;
};