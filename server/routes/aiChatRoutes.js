import express from 'express';
import { sendMessage, getChatHistory, testDataComparison } from '../controllers/aiChatController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Send message to AI assistant
router.post('/send', sendMessage);

// Get chat history
router.get('/history', getChatHistory);

// Test endpoint to compare data
router.get('/test-comparison', testDataComparison);

export default router;
