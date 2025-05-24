import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from "cors";


import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import transaksiRoutes from './routes/transaksiRoutes.js';
import historyRoutes from './routes/historyRoutes.js';

const app = express();
const prisma = new PrismaClient();

const corsOptions = {
  origin: [
    'http://localhost:5000', 
    'https://yourdomain.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname (karena kamu pakai ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve file dokumentasi dari folder /docs
app.use('/docs', express.static(path.join(__dirname, 'docs')));

app.use("/api", userRoutes)
app.use("/api", authRoutes)
app.use("/api", transaksiRoutes)
app.use("/api", historyRoutes)
app.get("/api", (req, res) => {
  res.redirect("/docs");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log('Server running on port 3000'));