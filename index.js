import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from "cors";


import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

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

app.use("/api", userRoutes)
app.use("/api", authRoutes)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log('Server running on port 3000'));