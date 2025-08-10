import express from 'express';
import { sendContactEmail } from '../controllers/contactController.js';

const router = express.Router();

// POST /api/contact - Handle contact form submission
router.post('/', sendContactEmail);

export default router;
