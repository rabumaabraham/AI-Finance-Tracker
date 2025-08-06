// Bank API Routes
import express from 'express';
import { 
  connectBank, 
  getTransactions, 
  getBankDetails, 
  getRequisitionStatus,
  getConnectedBanks,
  removeBank
} from '../controllers/nordigenController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/connect-bank', connectBank);

// Protected routes (require authentication)
router.get('/transactions/:requisitionId', verifyToken, getTransactions);
router.get('/details/:requisitionId', verifyToken, getBankDetails);
router.get('/status/:requisitionId', verifyToken, getRequisitionStatus);
router.get('/connected-banks', verifyToken, getConnectedBanks);
router.delete('/remove/:requisitionId', verifyToken, removeBank);

export default router;
