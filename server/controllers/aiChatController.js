import OpenAI from "openai";
import dotenv from "dotenv";
import { getUserFinancialData } from '../services/financialDataService.js';

dotenv.config();

// Initialize the OpenRouter client
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/**
 * Get user's financial context for AI assistant (now uses shared service)
 */
async function getUserFinancialContext(userId) {
  try {
    // Use the shared financial data service - EXACTLY same as analytics
    const financialData = await getUserFinancialData(userId, 'month');
    
    console.log(`🤖 AI Chat - User ${userId}: ${financialData.transactionCount} valid transactions`);
    
    return {
      bankAccounts: financialData.bankAccounts,
      totalBalance: financialData.totalBalance,
      totalIncome: financialData.totalIncome,
      totalExpenses: financialData.totalExpenses,
      netAmount: financialData.netAmount,
      transactionCount: financialData.transactionCount,
      topCategories: financialData.topCategories,
      recentTransactions: financialData.recentTransactions,
      // Add all categories for better matching
      allCategories: Object.entries(financialData.categoryBreakdown).map(([category, amount]) => ({
        category,
        amount
      }))
    };
  } catch (error) {
    console.error('Error getting financial context:', error);
    return null;
  }
}

/**
 * Test endpoint to compare analytics and AI chat data
 */
export const testDataComparison = async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log(`🔍 Testing data comparison for User ${userId}`);
    
    // Get data using shared service (both AI chat and analytics will use this)
    const sharedData = await getUserFinancialData(userId, 'month');
    
    // Get detailed category breakdown
    const categoryDetails = {};
    sharedData.rawTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        const category = tx.normalizedCategory;
        if (!categoryDetails[category]) {
          categoryDetails[category] = {
            total: 0,
            transactions: []
          };
        }
        categoryDetails[category].total += Math.abs(tx.amount);
        categoryDetails[category].transactions.push({
          name: tx.name,
          amount: tx.amount,
          date: tx.date
        });
      }
    });
    
    // Special investigation for transport category
    const transportTransactions = sharedData.rawTransactions.filter(tx => 
      tx.type === 'expense' && 
      (tx.normalizedCategory.toLowerCase().includes('transport') || 
       tx.normalizedCategory.toLowerCase().includes('travel') ||
       tx.category.toLowerCase().includes('transport') ||
       tx.category.toLowerCase().includes('travel'))
    );
    
    const comparison = {
      userId,
      sharedData: {
        totalIncome: sharedData.totalIncome,
        totalExpenses: sharedData.totalExpenses,
        netAmount: sharedData.netAmount,
        transactionCount: sharedData.transactionCount,
        topCategories: sharedData.topCategories.slice(0, 5),
        period: sharedData.period
      },
      categoryDetails: Object.entries(categoryDetails).map(([category, data]) => ({
        category,
        total: data.total,
        transactionCount: data.transactions.length,
        transactions: data.transactions.slice(0, 3) // Show first 3 transactions
      })),
      transportInvestigation: {
        totalFromCategoryBreakdown: categoryDetails['Transport'] || categoryDetails['transport'] || 0,
        totalFromRawTransactions: transportTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
        transportTransactions: transportTransactions.map(tx => ({
          name: tx.name,
          amount: tx.amount,
          category: tx.category,
          normalizedCategory: tx.normalizedCategory,
          date: tx.date
        }))
      },
      message: "Detailed category breakdown from shared data service"
    };
    
    console.log('🔍 Detailed Data from Shared Service:', comparison);
    
    res.json(comparison);
  } catch (error) {
    console.error('Error in data comparison:', error);
    res.status(500).json({ error: 'Failed to compare data' });
  }
};

/**
 * Send message to AI assistant
 */
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get user's financial context
    const financialContext = await getUserFinancialContext(userId);
    
    // Debug: Log the financial context for verification
    console.log(`🤖 AI Chat Debug - User ${userId}:`, {
      bankAccounts: financialContext?.bankAccounts,
      totalBalance: financialContext?.totalBalance,
      totalIncome: financialContext?.totalIncome,
      totalExpenses: financialContext?.totalExpenses,
      netAmount: financialContext?.netAmount,
      transactionCount: financialContext?.transactionCount,
      allCategories: financialContext?.allCategories?.map(cat => `${cat.category}: €${cat.amount.toFixed(2)}`),
      message: message.substring(0, 50) + (message.length > 50 ? '...' : '') // Show first 50 chars of user message
    });
    
    // Create system prompt with financial context
    let systemPrompt = `You are a helpful AI financial assistant. You have access to the user's financial data and can provide personalized advice. Be conversational, helpful, and professional. Keep responses concise but informative.

CRITICAL RULE: You must use ONLY the exact numbers provided in the financial data below. NEVER calculate, estimate, or approximate anything yourself.`;
    
    if (financialContext) {
      systemPrompt += `\n\n=== USER'S FINANCIAL DATA (EXACT FROM DATABASE) ===

SUMMARY:
- Connected bank accounts: ${financialContext.bankAccounts}
- Total balance: €${financialContext.totalBalance.toFixed(2)}
- Monthly income: €${financialContext.totalIncome.toFixed(2)}
- Monthly expenses: €${financialContext.totalExpenses.toFixed(2)}
- Net amount: €${financialContext.netAmount.toFixed(2)}
- Total transactions: ${financialContext.transactionCount}

CATEGORY BREAKDOWN (EXACT AMOUNTS):
${financialContext.allCategories.map(cat => `• ${cat.category}: €${cat.amount.toFixed(2)}`).join('\n')}

=== RESPONSE RULES ===
1. For category questions: Find the EXACT category name from the list above
2. Use ONLY the amounts shown above - never calculate
3. If category not found, say "I don't see [category] in your data"
4. For general questions: Use the summary numbers only`;
    } else {
      systemPrompt += `\n\nThe user hasn't connected any bank accounts yet. Encourage them to connect their accounts for personalized financial insights.`;
    }
    
    // Send message to OpenRouter
    const completion = await openrouter.chat.completions.create({
      model: "meta-llama/llama-3.1-405b-instruct:free",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      throw new Error('Invalid response from AI service');
    }
    
    const aiResponse = completion.choices[0].message.content;
    
    res.json({
      success: true,
      message: aiResponse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
};

/**
 * Get chat history (placeholder for future implementation)
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.userId;
    
    // For now, return empty array - can be extended to store chat history
    res.json({
      success: true,
      messages: []
    });
    
  } catch (error) {
    console.error('Get Chat History Error:', error);
    res.status(500).json({
      error: 'Failed to get chat history',
      details: error.message
    });
  }
};
