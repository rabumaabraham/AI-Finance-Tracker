import express from 'express';
const router = express.Router();

import { connectBank } from '../controllers/nordigenController.js';

router.get('/connect-bank', connectBank);

export default router;
