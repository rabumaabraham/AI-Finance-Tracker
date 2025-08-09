import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getMySubscription, updateSubscription, cancelSubscription, canConnectMoreBanks } from '../controllers/subscriptionController.js';

const router = express.Router();

router.get('/me', verifyToken, getMySubscription);
router.post('/update', verifyToken, updateSubscription);
router.post('/cancel', verifyToken, cancelSubscription);
router.get('/can-connect', verifyToken, canConnectMoreBanks);

export default router;


