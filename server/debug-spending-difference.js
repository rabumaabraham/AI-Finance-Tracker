import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from './models/transaction.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

// Test user ID (replace with your actual user ID)
const testUserId = '6894a5ff7be71f38ea005519'; // Replace with your user ID

async function debugSpendingDifference() {
  console.log('🔍 Debugging Spending Difference for Transport Category');
  console.log('==================================================');
  
  const now = new Date();
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
  
  console.log(`📅 Date Range: ${startDate.toISOString()} to ${now.toISOString()}`);
  
  // Get ALL transactions for the user in the date range
  const allTransactions = await Transaction.find({
    userId: testUserId,
    date: { $gte: startDate, $lte: now }
  });
  
  console.log(`📊 Total transactions found: ${allTransactions.length}`);
  
  // Filter for Transport category (case insensitive)
  const transportTransactions = allTransactions.filter(tx => 
    tx.category && tx.category.toLowerCase().includes('transport')
  );
  
  console.log(`🚗 Transport transactions found: ${transportTransactions.length}`);
  
  // Show all transport transactions
  console.log('\n📋 All Transport Transactions:');
  transportTransactions.forEach((tx, index) => {
    console.log(`${index + 1}. ${tx.name} - €${tx.amount} - ${tx.category} - ${tx.date}`);
  });
  
  // Calculate total spending on transport
  const totalTransportSpending = transportTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  console.log(`\n💰 Total Transport Spending: €${totalTransportSpending.toFixed(2)}`);
  
  // Check for different category variations
  const categoryVariations = [...new Set(transportTransactions.map(tx => tx.category))];
  console.log('\n🏷️ Category Variations Found:');
  categoryVariations.forEach(cat => {
    const transactionsInCategory = transportTransactions.filter(tx => tx.category === cat);
    const spendingInCategory = transactionsInCategory.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    console.log(`  - "${cat}": ${transactionsInCategory.length} transactions, €${spendingInCategory.toFixed(2)}`);
  });
  
  // Check for transactions with different types
  const incomeTransactions = transportTransactions.filter(tx => tx.type === 'income');
  const expenseTransactions = transportTransactions.filter(tx => tx.type === 'expense');
  
  console.log('\n📈 Transaction Types:');
  console.log(`  - Income: ${incomeTransactions.length} transactions`);
  console.log(`  - Expense: ${expenseTransactions.length} transactions`);
  
  // Calculate spending by type
  const incomeTotal = incomeTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const expenseTotal = expenseTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  console.log(`  - Income Total: €${incomeTotal.toFixed(2)}`);
  console.log(`  - Expense Total: €${expenseTotal.toFixed(2)}`);
  
  console.log('\n🎯 Conclusion:');
  console.log(`Budget system shows: ~€800 (expenses only)`);
  console.log(`Analytics shows: €1046.40 (all transactions)`);
  console.log(`Actual total: €${totalTransportSpending.toFixed(2)}`);
  
  await mongoose.disconnect();
  console.log('\n✅ Debug complete');
}

debugSpendingDifference().catch(console.error);
