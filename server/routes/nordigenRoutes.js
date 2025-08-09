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

// Protected routes
router.get('/connect-bank', verifyToken, connectBank);

router.get('/transactions/:requisitionId', verifyToken, getTransactions);
router.get('/details/:requisitionId', verifyToken, getBankDetails);
router.get('/status/:requisitionId', verifyToken, getRequisitionStatus);
router.get('/connected-banks', verifyToken, getConnectedBanks);
router.delete('/remove/:requisitionId', verifyToken, removeBank);

export default router;
