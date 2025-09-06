// Main Server Entry Point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import nordigenRoutes from './routes/nordigenRoutes.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import aiChatRoutes from './routes/aiChatRoutes.js';
import userRoutes from './routes/userRoutes.js';
import subscriptionRoutes, { webhookRouter } from './routes/subscriptionRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

dotenv.config();

const app = express();

// CORS Configuration
const allowedOrigins = [
  // Development origins
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8000',
  // Production origins
  process.env.FRONTEND_URL || 'https://finance-tracker-six-iota.vercel.app'
].filter(Boolean);

// CORS middleware with environment-based configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Reject origin
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
// Stripe webhook needs raw body; mount BEFORE json middleware for that route would be better
app.use(webhookRouter);

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
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/contact', contactRoutes);

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Start server // app.listen(5000, () => console.log("Server on port 5000"));

app.listen(process.env.PORT || 5000, () => console.log("Server on port", process.env.PORT || 5000));


