// Analytics API Routes
import express from 'express';
import { 
  getCombinedAnalytics, 
  getBankAnalytics, 
  getConnectedBanks 
} from '../controllers/analyticsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get combined analytics from all banks
router.get('/combined', getCombinedAnalytics);

// Get analytics for specific bank
router.get('/bank/:bankAccountId', getBankAnalytics);

// Get connected banks for filter dropdown
router.get('/banks', getConnectedBanks);

export default router;
