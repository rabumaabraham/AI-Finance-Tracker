import express from 'express';
import { connectBank, getTransactions } from '../controllers/nordigenController.js';

const router = express.Router();

router.get('/connect-bank', connectBank);
router.get('/transactions/:requisitionId', getTransactions); // 👈 new route

export default router;
