// Main Server Entry Point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import nordigenRoutes from './routes/nordigenRoutes.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => res.send("Server running"));

// Test endpoint for debugging
app.get("/test", (req, res) => {
    res.json({ 
        message: "Server is working", 
        timestamp: new Date().toISOString(),
        mongoUri: process.env.MONGO_URI ? "Set" : "Not set"
    });
});

// API Routes
app.use('/api/bank', nordigenRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budget', budgetRoutes);

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Start server
app.listen(5000, () => console.log("Server on port 5000"));


