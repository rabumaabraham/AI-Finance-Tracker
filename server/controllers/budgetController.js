import Budget from '../models/budget.js';
import Transaction from '../models/transaction.js';
import { sendBudgetAlerts } from '../services/emailService.js';

// Get all budgets for user
export const getBudgets = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const budgets = await Budget.find({ 
      userId: req.userId, 
      period,
      isActive: true 
    }).sort({ category: 1 });

    console.log('Found budgets:', budgets.map(b => ({ category: b.category, limit: b.limit })));

    // Get current spending for each budget
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'month': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case 'quarter': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case 'year': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all transactions (not just expenses) to match analytics
    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: now }
    });

    console.log('Found transactions:', transactions.length);
    console.log('Transaction categories:', [...new Set(transactions.map(tx => tx.category))]);

    // Calculate spending per category (normalize categories) - include all transactions
    const spendingByCategory = {};
    transactions.forEach(tx => {
      const category = (tx.category || 'Uncategorized').trim();
      spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs(tx.amount);
    });

    console.log('Spending by category:', spendingByCategory);

    // Combine budgets with spending data
    const budgetsWithSpending = budgets.map(budget => {
      const spent = spendingByCategory[budget.category] || 0;
      const remaining = budget.limit - spent;
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      
      console.log(`Budget ${budget.category}: limit=${budget.limit}, spent=${spent}, percentage=${percentage}%`);
      
      return {
        id: budget._id,
        category: budget.category,
        limit: budget.limit,
        period: budget.period,
        spent: spent,
        remaining: remaining,
        percentage: percentage
      };
    });

    console.log('Final budgets with spending:', budgetsWithSpending);
    res.status(200).json(budgetsWithSpending);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

// Create or update budget
export const setBudget = async (req, res) => {
  try {
    const { category, limit, period = 'month' } = req.body;
    
    if (!category || !limit || limit <= 0) {
      return res.status(400).json({ error: 'Category and positive limit are required' });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, category, period },
      { limit, isActive: true },
      { upsert: true, new: true }
    );

    res.status(200).json({ 
      message: 'Budget set successfully',
      budget: {
        id: budget._id,
        category: budget.category,
        limit: budget.limit,
        period: budget.period
      }
    });
  } catch (error) {
    console.error('Error setting budget:', error);
    res.status(500).json({ error: 'Failed to set budget' });
  }
};

// Delete budget
export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    
    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.status(200).json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

// Get budget alerts (categories exceeding 80% of limit)
export const getBudgetAlerts = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const budgets = await Budget.find({ 
      userId: req.userId, 
      period,
      isActive: true 
    });

    if (budgets.length === 0) {
      return res.status(200).json({ alerts: [] });
    }

    // Get current spending
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'month': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case 'quarter': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case 'year': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all transactions (not just expenses) to match analytics
    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: now }
    });

    // Calculate spending per category (normalize categories) - include all transactions
    const spendingByCategory = {};
    transactions.forEach(tx => {
      const category = (tx.category || 'Uncategorized').trim();
      spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs(tx.amount);
    });

    console.log('Alerts - Spending by category:', spendingByCategory);

    // Find budgets exceeding 80% of limit
    const alerts = budgets
      .map(budget => {
        const spent = spendingByCategory[budget.category] || 0;
        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
        
        console.log(`Alert check ${budget.category}: limit=${budget.limit}, spent=${spent}, percentage=${percentage}%`);
        
        return { budget, spent, percentage };
      })
      .filter(item => item.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage);

    console.log('Generated alerts:', alerts);
    
    // Send email notifications for alerts
    if (alerts.length > 0) {
      try {
        const emailResults = await sendBudgetAlerts(alerts);
        console.log(`📧 Email notification results:`, emailResults);
      } catch (emailError) {
        console.error('❌ Error sending email notifications:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    res.status(200).json({ alerts });
  } catch (error) {
    console.error('Error fetching budget alerts:', error);
    res.status(500).json({ error: 'Failed to fetch budget alerts' });
  }
};
