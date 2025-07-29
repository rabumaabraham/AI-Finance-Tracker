// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import nordigenRoutes from './routes/nordigenRoutes.js';
import authRoutes from './routes/auth.js'; // 👈 new import

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Server running"));

app.use('/api/bank', nordigenRoutes);
app.use('/api/auth', authRoutes); // 👈 new line

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.listen(5000, () => console.log("Server on port 5000"));


