import Transaction from '../models/transaction.js';
import BankAccount from '../models/bankAccount.js';

/**
 * Normalize category names (shared function)
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

/**
 * Get user's financial data (shared function for both analytics and AI chat)
 */
export async function getUserFinancialData(userId, period = 'month') {
  try {
    console.log(`📊 Getting financial data for User ${userId}, period: ${period}`);
    
    // Get user's bank accounts
    const bankAccounts = await BankAccount.find({ userId, status: 'connected' });
    
    // Get date range - same logic as analytics
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get transactions with bank info - EXACTLY same as analytics
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lte: now }
    }).populate('bankAccountId', 'bankName status');

    // Only include transactions from connected banks - EXACTLY same as analytics
    const validTransactions = transactions.filter(tx => 
      tx.bankAccountId && tx.bankAccountId.status === 'connected'
    );

    console.log(`📊 User ${userId}: ${validTransactions.length} valid transactions`);

    // Calculate financial summary - EXACTLY same logic as analytics
    const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    const totalIncome = validTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpenses = validTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Category breakdown - EXACTLY same as analytics
    const categoryBreakdown = {};
    validTransactions.forEach(tx => {
      const amount = Math.abs(tx.amount);
      
      if (tx.type === 'expense') {
        const normalizedCategory = normalizeCategory(tx.category);
        if (!categoryBreakdown[normalizedCategory]) {
          categoryBreakdown[normalizedCategory] = 0;
        }
        categoryBreakdown[normalizedCategory] += amount;
      }
    });

    // Bank breakdown - EXACTLY same as analytics
    const bankBreakdown = {};
    validTransactions.forEach(tx => {
      const bankName = tx.bankAccountId?.bankName || 'Unknown Bank';
      if (!bankBreakdown[bankName]) {
        bankBreakdown[bankName] = 0;
      }
      bankBreakdown[bankName] += Math.abs(tx.amount);
    });

    // Get top categories - EXACTLY same as analytics
    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Get recent transactions - EXACTLY same as analytics
    const recentTransactions = validTransactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(tx => ({
        id: tx._id,
        name: tx.name,
        amount: tx.amount,
        category: normalizeCategory(tx.category),
        date: tx.date,
        type: tx.type,
        bankName: tx.bankAccountId?.bankName || 'Unknown Bank'
      }));

    const result = {
      userId,
      period,
      bankAccounts: bankAccounts.length,
      totalBalance,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      transactionCount: validTransactions.length,
      categoryBreakdown,
      bankBreakdown,
      topCategories,
      recentTransactions,
      // Raw data for debugging
      rawTransactions: validTransactions.map(t => ({
        id: t._id,
        name: t.name,
        amount: t.amount,
        category: t.category,
        normalizedCategory: normalizeCategory(t.category),
        date: t.date,
        type: t.type,
        bankName: t.bankAccountId?.bankName || 'Unknown Bank'
      }))
    };

    console.log(`📊 Financial data for User ${userId}:`, {
      totalIncome: result.totalIncome,
      totalExpenses: result.totalExpenses,
      netAmount: result.netAmount,
      transactionCount: result.transactionCount,
      topCategories: result.topCategories.slice(0, 3)
    });

    return result;
  } catch (error) {
    console.error('Error getting financial data:', error);
    throw error;
  }
}
