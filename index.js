import express from 'express';
import cors from "cors";

import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';

import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import transaksiRoutes from './routes/transaksiRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import cookieParser from 'cookie-parser';

const app = express();

const allowedOrigins = [
  'http://localhost:5000',
  'https://yourdomain.com',
  'https://donasi-app-dot-c-01-450604.uc.r.appspot.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) { // !origin mengizinkan request tanpa origin (seperti dari Postman atau curl)
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(morgan('dev'));

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());


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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
