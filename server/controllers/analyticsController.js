// Analytics Controller
import Transaction from "../models/transaction.js";
import BankAccount from "../models/bankAccount.js";

/**
 * Robust normalization to remove various prefixes
 * @param {string} category - The raw category from database
 * @returns {string} - The normalized category name
 */
function normalizeCategory(category) {
  if (!category) return "Uncategorized";
  
  let normalizedCategory = category;
  
  // Remove common prefixes
  const prefixesToRemove = [
    /^category:\s*/i,
    /^type:\s*/i,
    /^cat:\s*/i,
    /^spending category:\s*/i,
    /^transaction category:\s*/i,
    /^the category is:\s*/i,
    /^this is:\s*/i,
    /^classified as:\s*/i,
    /^categorized as:\s*/i
  ];
  
  prefixesToRemove.forEach(prefix => {
    normalizedCategory = normalizedCategory.replace(prefix, '');
  });
  
  // Remove any remaining quotes, periods, or extra whitespace
  normalizedCategory = normalizedCategory.replace(/['"]/g, '').replace(/\.$/, '').trim();
  
  // Special handling for transport categories to ensure consistency
  if (normalizedCategory.toLowerCase().includes('transport') || 
      normalizedCategory.toLowerCase().includes('travel') ||
      normalizedCategory.toLowerCase().includes('transportation')) {
    return "Transport";
  }
  
  return normalizedCategory || "Uncategorized";
}

// Get combined analytics from all banks
export const getCombinedAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Get date range - Professional rolling time periods
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Last 365 days
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    }

    // Get all transactions for user in date range with bank info
    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: now }
    }).populate('bankAccountId', 'bankName status');

    // Only include transactions from connected banks
    const validTransactions = transactions.filter(tx => 
      tx.bankAccountId && tx.bankAccountId.status === 'connected'
    );

    // Debug: Log transaction processing
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Processing ${validTransactions.length} transactions for analytics`);
    }

    // Calculate analytics
    const analytics = {
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0,
      transactionCount: validTransactions.length,
      categoryBreakdown: {},
      bankBreakdown: {},
      topCategories: [],
      recentTransactions: []
    };

    // Process transactions
    validTransactions.forEach(tx => {
      const amount = Math.abs(tx.amount);
      
      if (tx.type === 'income') {
        analytics.totalIncome += amount;
      } else {
        analytics.totalExpenses += amount;
      }

      // Category breakdown
      const normalizedCategory = normalizeCategory(tx.category);
      if (!analytics.categoryBreakdown[normalizedCategory]) {
        analytics.categoryBreakdown[normalizedCategory] = 0;
      }
      analytics.categoryBreakdown[normalizedCategory] += amount;

      // Bank breakdown
      const bankName = tx.bankAccountId?.bankName || 'Unknown Bank';
      if (!analytics.bankBreakdown[bankName]) {
        analytics.bankBreakdown[bankName] = 0;
      }
      analytics.bankBreakdown[bankName] += amount;
    });

    analytics.netAmount = analytics.totalIncome - analytics.totalExpenses;

    // Debug: Log final analytics summary (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Analytics: Income: €${analytics.totalIncome}, Expenses: €${analytics.totalExpenses}, Net: €${analytics.netAmount}, Count: ${analytics.transactionCount}`);
    }

    // Get top 5 categories
    analytics.topCategories = Object.entries(analytics.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Get recent 10 transactions
    analytics.recentTransactions = validTransactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(tx => ({
        id: tx._id,
        name: tx.name,
        amount: tx.amount,
        category: normalizeCategory(tx.category),
        date: tx.date,
        bankName: tx.bankAccountId?.bankName || 'Unknown Bank'
      }));

    res.status(200).json(analytics);
  } catch (err) {
    console.error("Error fetching combined analytics:", err.message);
    res.status(500).json({ error: "Failed to fetch analytics." });
  }
};

// Get analytics for specific bank
export const getBankAnalytics = async (req, res) => {
  try {
    const { bankAccountId } = req.params;
    const { period = 'month' } = req.query;

    // Verify bank belongs to user and is connected
    const bankAccount = await BankAccount.findOne({
      _id: bankAccountId,
      userId: req.userId,
      status: 'connected'
    });

    if (!bankAccount) {
      return res.status(404).json({ error: "Connected bank account not found." });
    }

    // Get date range - Professional rolling time periods
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Last 365 days
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    }

    // Get transactions for specific bank
    const transactions = await Transaction.find({
      userId: req.userId,
      bankAccountId: bankAccountId,
      date: { $gte: startDate, $lte: now }
    });

    console.log(`📊 Bank Analytics - Found ${transactions.length} transactions for bank ${bankAccountId}`);
    console.log('📊 Bank transaction details:', transactions.map(tx => ({ 
      id: tx._id, 
      bankAccountId: tx.bankAccountId, 
      amount: tx.amount,
      type: tx.type 
    })));

    // Calculate analytics (same logic as combined)
    const analytics = {
      bankName: bankAccount.bankName,
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0,
      transactionCount: transactions.length,
      categoryBreakdown: {},
      topCategories: [],
      recentTransactions: []
    };

    transactions.forEach(tx => {
      const amount = Math.abs(tx.amount);
      
      if (tx.type === 'income') {
        analytics.totalIncome += amount;
      } else {
        analytics.totalExpenses += amount;
      }

      // Category breakdown
      const normalizedCategory = normalizeCategory(tx.category);
      if (!analytics.categoryBreakdown[normalizedCategory]) {
        analytics.categoryBreakdown[normalizedCategory] = 0;
      }
      analytics.categoryBreakdown[normalizedCategory] += amount;
    });

    analytics.netAmount = analytics.totalIncome - analytics.totalExpenses;

    analytics.topCategories = Object.entries(analytics.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    analytics.recentTransactions = transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(tx => ({
        id: tx._id,
        name: tx.name,
        amount: tx.amount,
        category: normalizeCategory(tx.category),
        date: tx.date
      }));

    res.status(200).json(analytics);
  } catch (err) {
    console.error("Error fetching bank analytics:", err.message);
    res.status(500).json({ error: "Failed to fetch bank analytics." });
  }
};

// Get user's connected banks for filter dropdown
export const getConnectedBanks = async (req, res) => {
  try {
    const banks = await BankAccount.find({
      userId: req.userId,
      status: 'connected'
    }).select('_id bankName accountType');

    const bankList = banks.map(bank => ({
      id: bank._id,
      name: bank.bankName,
      type: bank.accountType
    }));

    res.status(200).json(bankList);
  } catch (err) {
    console.error("Error fetching connected banks:", err.message);
    res.status(500).json({ error: "Failed to fetch connected banks." });
  }
};
