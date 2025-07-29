// server/routes/nordigenRoutes.js
import express from 'express';
import { connectBank, getTransactions } from '../controllers/nordigenController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/connect-bank', connectBank);
router.get('/transactions/:requisitionId', verifyToken, getTransactions);

export default router;
