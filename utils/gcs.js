// src/utils/gcs.js
import { Storage } from '@google-cloud/storage';
import path from 'path';

// Inisialisasi Google Cloud Storage client
// Pastikan GOOGLE_APPLICATION_CREDENTIALS environment variable sudah diatur
// yang menunjuk ke file kunci JSON service account Anda.
// Contoh: GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json



const bucketName = process.env.GCS_BUCKET_NAME; // Nama bucket GCS Anda, definisikan di .env
const projectId = process.env.GCP_PROJECT_ID;
const clientEmail = process.env.GCP_CLIENT_EMAIL;
// private_key dari .env mungkin memiliki '\n' literal, kita perlu menggantinya dengan karakter newline asli
const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n');


// Validasi keberadaan environment variables
if (!bucketName || !projectId || !clientEmail || !privateKey) {
  console.error('Error: One or more GCS environment variables are missing.');
  console.error('Please ensure GCS_BUCKET_NAME, GCP_PROJECT_ID, GCP_CLIENT_EMAIL, and GCP_PRIVATE_KEY are set.');
  process.exit(1); // Keluar dari aplikasi jika kredensial tidak lengkap
}
const storage = new Storage({
  projectId: projectId,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
});

const bucket = storage.bucket(bucketName);

/**
 * Mengunggah buffer file ke Google Cloud Storage.
 * @param {Buffer} fileBuffer - Konten file sebagai Buffer.
 * @param {string} originalname - Nama asli file.
 * @param {string} mimetype - Tipe MIME file (misalnya, 'image/jpeg').
 * @returns {Promise<string>} URL publik dari file yang diunggah.
 */
const uploadFileToGCS = async (fileBuffer, originalname, mimetype) => {
  // Buat nama file yang unik untuk menghindari tabrakan
  const uniqueFileName = `${Date.now()}-${originalname.replace(/\s/g, '_')}`;
  const file = bucket.file(uniqueFileName);

  // Buat write stream untuk mengunggah file
  const stream = file.createWriteStream({
    metadata: {
      contentType: mimetype, // Atur tipe konten file
    },
    resumable: false, // Untuk file kecil, false biasanya lebih baik
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => {
      console.error('Error uploading to GCS:', err);
      reject(err);
    });

    stream.on('finish', async () => {
      try {
        // Jadikan file dapat dibaca publik (jika bucket tidak diatur untuk publik secara default)
        // Jika bucket Anda sudah diatur untuk publik (allUsers Storage Object Viewer), baris ini bisa dihilangkan
        // await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`;
        resolve(publicUrl);
      } catch (publicError) {
        console.error('Error making file public:', publicError);
        reject(publicError);
      }
    });

    // Akhiri stream dengan buffer file
    stream.end(fileBuffer);
  });
};

export { uploadFileToGCS };