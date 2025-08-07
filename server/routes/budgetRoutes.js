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

// Test endpoint to manually trigger email notifications
router.post('/test-email', async (req, res) => {
  try {
    const { sendBudgetAlerts } = await import('../services/emailService.js');
    
    // Create a test alert
    const testAlert = {
      budget: {
        userId: req.userId,
        category: 'Test Category',
        limit: 100
      },
      spent: 95,
      percentage: 95
    };
    
    const result = await sendBudgetAlerts([testAlert]);
    res.status(200).json({ 
      message: 'Test email sent', 
      result 
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

export default router;
