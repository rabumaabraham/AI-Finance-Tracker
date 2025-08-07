import express from 'express';
import { getBudgets, setBudget, deleteBudget, getBudgetAlerts } from '../controllers/budgetController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all budgets
router.get('/', getBudgets);

// Set budget
router.post('/', setBudget);

// Delete budget
router.delete('/:id', deleteBudget);

// Get budget alerts
router.get('/alerts', getBudgetAlerts);

export default router;
