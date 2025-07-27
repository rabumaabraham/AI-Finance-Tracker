import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import nordigenRoutes from './routes/nordigenRoutes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Example route
app.get("/", (req, res) => res.send("Server running"));

app.use('/api/bank', nordigenRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.listen(5000, () => console.log("Server on port 5000"));
