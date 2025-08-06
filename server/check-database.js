// Database Check Script - Run this to verify your MongoDB Atlas data
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to your MongoDB Atlas database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Check database contents
const checkDatabase = async () => {
  try {
    console.log('\n📊 DATABASE ANALYSIS REPORT');
    console.log('============================\n');

    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name));

    // Check transactions - using raw MongoDB queries to avoid schema issues
    const db = mongoose.connection.db;
    const transactionCount = await db.collection('transactions').countDocuments();
    console.log(`\n💳 Total Transactions: ${transactionCount}`);

    if (transactionCount > 0) {
      // Get sample transactions with raw data
      const sampleTransactions = await db.collection('transactions').find({}).limit(5).toArray();
      console.log('\n📋 Sample Transactions:');
      sampleTransactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.name || 'Unknown'} - €${tx.amount || 0} (${tx.category || 'Unknown'}) - ${tx.date ? new Date(tx.date).toLocaleDateString() : 'No date'}`);
      });

      // Get transaction summary
      const incomeTransactions = await db.collection('transactions').find({ type: 'income' }).toArray();
      const expenseTransactions = await db.collection('transactions').find({ type: 'expense' }).toArray();
      
      const totalIncome = incomeTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
      const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
      
      console.log(`\n💰 Income Transactions: ${incomeTransactions.length} (Total: €${totalIncome.toFixed(2)})`);
      console.log(`💸 Expense Transactions: ${expenseTransactions.length} (Total: €${totalExpenses.toFixed(2)})`);
      console.log(`📈 Net Amount: €${(totalIncome - totalExpenses).toFixed(2)}`);

      // Show some real transaction examples
      console.log('\n🔍 Real Transaction Examples:');
      const realTransactions = await db.collection('transactions').find({}).limit(3).toArray();
      realTransactions.forEach((tx, index) => {
        console.log(`Transaction ${index + 1}:`);
        console.log(`  - Name: ${tx.name}`);
        console.log(`  - Amount: €${tx.amount}`);
        console.log(`  - Type: ${tx.type}`);
        console.log(`  - Category: ${tx.category}`);
        console.log(`  - Date: ${tx.date ? new Date(tx.date).toLocaleDateString() : 'No date'}`);
        console.log(`  - Bank Account ID: ${tx.bankAccountId}`);
        console.log(`  - User ID: ${tx.userId}`);
        console.log('');
      });
    }

    // Check bank accounts
    const bankCount = await db.collection('bankaccounts').countDocuments();
    console.log(`🏦 Total Bank Accounts: ${bankCount}`);

    if (bankCount > 0) {
      const banks = await db.collection('bankaccounts').find({}).toArray();
      console.log('\n🏛️ Connected Banks:');
      banks.forEach((bank, index) => {
        console.log(`${index + 1}. ${bank.bankName || 'Unknown'} - ${bank.status || 'Unknown'} - ${bank.accountType || 'Unknown'}`);
      });
    }

    // Check users
    const userCount = await db.collection('users').countDocuments();
    console.log(`\n👤 Total Users: ${userCount}`);

    if (userCount > 0) {
      const users = await db.collection('users').find({}).toArray();
      console.log('\n👥 Users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email || 'Unknown'} - Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}`);
      });
    }

    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Run the check
connectDB().then(checkDatabase); 