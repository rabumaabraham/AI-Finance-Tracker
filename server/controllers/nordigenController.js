// Bank Connection Controller
import axios from "axios";
import mongoose from "mongoose";
import Transaction from "../models/transaction.js";
import BankAccount from "../models/bankAccount.js";
import { categorizeWithOpenRouter } from "../services/openrouterService.js";
import Subscription from "../models/subscription.js";
import dotenv from "dotenv";

dotenv.config();

let accessToken = null;

// Simple rule-based categorization fallback when AI fails
function getFallbackCategory(transactionName, amount) {
  const name = transactionName.toLowerCase();
  
  // Income patterns
  if (amount > 0) {
    if (name.includes('salary') || name.includes('wage') || name.includes('payroll')) {
      return 'Salary';
    }
    if (name.includes('refund') || name.includes('return')) {
      return 'Refund';
    }
    if (name.includes('interest') || name.includes('dividend')) {
      return 'Investment';
    }
    return 'Income';
  }
  
  // Expense patterns
  if (name.includes('grocery') || name.includes('supermarket') || name.includes('food') || name.includes('restaurant') || name.includes('cafe')) {
    return 'Groceries';
  }
  if (name.includes('gas') || name.includes('fuel') || name.includes('petrol') || name.includes('transport') || name.includes('bus') || name.includes('train') || name.includes('taxi') || name.includes('uber')) {
    return 'Transport';
  }
  if (name.includes('rent') || name.includes('mortgage') || name.includes('housing') || name.includes('utilities') || name.includes('electric') || name.includes('water') || name.includes('internet') || name.includes('phone')) {
    return 'Bills';
  }
  if (name.includes('medical') || name.includes('doctor') || name.includes('pharmacy') || name.includes('health') || name.includes('hospital')) {
    return 'Health';
  }
  if (name.includes('shopping') || name.includes('store') || name.includes('amazon') || name.includes('ebay') || name.includes('retail')) {
    return 'Shopping';
  }
  if (name.includes('entertainment') || name.includes('movie') || name.includes('cinema') || name.includes('netflix') || name.includes('spotify') || name.includes('game')) {
    return 'Entertainment';
  }
  if (name.includes('insurance') || name.includes('bank') || name.includes('fee') || name.includes('charge')) {
    return 'Bills';
  }
  
  return 'Other';
}

// Get GoCardless access token
const getAccessToken = async () => {
  if (accessToken) return accessToken;

  const { data } = await axios.post("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
    secret_id: process.env.NORDIGEN_SECRET_ID,
    secret_key: process.env.NORDIGEN_SECRET_KEY,
  });

  accessToken = data.access;
  return accessToken;
};

// Initiate bank connection
export const connectBank = async (req, res) => {
  try {
    const token = await getAccessToken();

    // Enforce subscription limit if user is authenticated
    try {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const sub = await Subscription.findOne({ userId: req.userId });
        const plan = sub?.plan || 'free';
        if (plan === 'free') {
          const count = await BankAccount.countDocuments({ userId: req.userId, status: 'connected' });
          if (count >= 1) {
            return res.status(403).json({
              error: 'LIMIT_REACHED',
              message: 'Free plan allows only 1 bank connection. Upgrade to connect more banks.',
              plan: 'free',
              limit: 1,
              current: count
            });
          }
        }
      }
    } catch (_) {}

    // Determine frontend base URL for redirect (Vercel in prod, localhost in dev)
    const defaultFrontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const requestOrigin = req.headers.origin;
    let frontendBaseUrl = defaultFrontendBase;
    // If the request Origin matches our configured base or is localhost, prefer it
    if (requestOrigin && (requestOrigin === defaultFrontendBase || /^(http:\/\/)?(localhost|127\.0\.0\.1)/.test(requestOrigin))) {
      frontendBaseUrl = requestOrigin;
    }
    const redirectUrl = `${frontendBaseUrl.replace(/\/$/, '')}/dashboard.html?status=success`;

    const requisitionRes = await axios.post(
      "https://bankaccountdata.gocardless.com/api/v2/requisitions/",
      {
        redirect: redirectUrl,
        institution_id: "SANDBOXFINANCE_SFIN0000",
        reference: `ref-${Date.now()}`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { id: requisitionId, link } = requisitionRes.data;
    res.status(200).json({ requisitionId, link });
  } catch (err) {
    console.error("Error connecting bank:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to connect bank." });
  }
};

// Initiate real bank connection (production)
export const connectRealBank = async (req, res) => {
  try {
    const token = await getAccessToken();

    // Enforce subscription limit if user is authenticated
    try {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const sub = await Subscription.findOne({ userId: req.userId });
        const plan = sub?.plan || 'free';
        if (plan === 'free') {
          const count = await BankAccount.countDocuments({ userId: req.userId, status: 'connected' });
          if (count >= 1) {
            return res.status(403).json({
              error: 'LIMIT_REACHED',
              message: 'Free plan allows only 1 bank connection. Upgrade to connect more banks.',
              plan: 'free',
              limit: 1,
              current: count
            });
          }
        }
      }
    } catch (_) {}

    // Determine frontend base URL for redirect (Vercel in prod, localhost in dev)
    const defaultFrontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const requestOrigin = req.headers.origin;
    let frontendBaseUrl = defaultFrontendBase;
    // If the request Origin matches our configured base or is localhost, prefer it
    if (requestOrigin && (requestOrigin === defaultFrontendBase || /^(http:\/\/)?(localhost|127\.0\.0\.1)/.test(requestOrigin))) {
      frontendBaseUrl = requestOrigin;
    }
    const redirectUrl = `${frontendBaseUrl.replace(/\/$/, '')}/dashboard.html?status=success`;

    // For real bank connections, return available institutions for user selection
    const institutionsRes = await axios.get(
      "https://bankaccountdata.gocardless.com/api/v2/institutions/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Filter out sandbox institutions for real bank connections
    const realInstitutions = institutionsRes.data.filter(inst => 
      !inst.id.includes('SANDBOX') && 
      !inst.id.includes('DEMO') &&
      inst.countries && inst.countries.length > 0
    );

    if (!realInstitutions || realInstitutions.length === 0) {
      return res.status(400).json({ 
        error: "No real bank institutions available",
        message: "Unable to find real bank institutions. Please try again later."
      });
    }

    // Return institutions for user selection
    res.status(200).json({ 
      institutions: realInstitutions.map(inst => ({
        id: inst.id,
        name: inst.name,
        bic: inst.bic,
        countries: inst.countries,
        logo: inst.logo
      }))
    });
  } catch (err) {
    console.error("Error connecting real bank:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to connect real bank." });
  }
};

// Connect to selected real bank
export const connectSelectedBank = async (req, res) => {
  try {
    const token = await getAccessToken();
    const { institutionId } = req.body;

    if (!institutionId) {
      return res.status(400).json({ error: "Institution ID is required" });
    }

    // Enforce subscription limit if user is authenticated
    try {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const sub = await Subscription.findOne({ userId: req.userId });
        const plan = sub?.plan || 'free';
        if (plan === 'free') {
          const count = await BankAccount.countDocuments({ userId: req.userId, status: 'connected' });
          if (count >= 1) {
            return res.status(403).json({
              error: 'LIMIT_REACHED',
              message: 'Free plan allows only 1 bank connection. Upgrade to connect more banks.',
              plan: 'free',
              limit: 1,
              current: count
            });
          }
        }
      }
    } catch (_) {}

    // Determine frontend base URL for redirect
    const defaultFrontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const requestOrigin = req.headers.origin;
    let frontendBaseUrl = defaultFrontendBase;
    if (requestOrigin && (requestOrigin === defaultFrontendBase || /^(http:\/\/)?(localhost|127\.0\.0\.1)/.test(requestOrigin))) {
      frontendBaseUrl = requestOrigin;
    }
    const redirectUrl = `${frontendBaseUrl.replace(/\/$/, '')}/dashboard.html?status=success`;

    const requisitionRes = await axios.post(
      "https://bankaccountdata.gocardless.com/api/v2/requisitions/",
      {
        redirect: redirectUrl,
        institution_id: institutionId,
        reference: `real-ref-${Date.now()}`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { id: requisitionId, link } = requisitionRes.data;
    res.status(200).json({ requisitionId, link });
  } catch (err) {
    console.error("Error connecting to selected bank:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to connect to selected bank." });
  }
};

// Fetch and categorize transactions
export const getTransactions = async (req, res) => {
  try {
    console.log(`🚀 getTransactions called for requisitionId: ${req.params.requisitionId}, userId: ${req.userId}`);
    const token = await getAccessToken();
    const { requisitionId } = req.params;

    // Find the bank account for this requisition
    const bankAccount = await BankAccount.findOne({ 
      requisitionId, 
      userId: req.userId 
    });

    console.log(`🏦 Bank account lookup result:`, bankAccount ? 'Found' : 'Not found');
    if (bankAccount) {
      console.log(`🏦 Bank account details:`, {
        id: bankAccount._id,
        requisitionId: bankAccount.requisitionId,
        bankName: bankAccount.bankName,
        status: bankAccount.status
      });
    }

    if (!bankAccount) {
      console.log(`❌ Bank account not found for requisitionId: ${requisitionId}, userId: ${req.userId}`);
      return res.status(404).json({ error: "Bank account not found." });
    }

    // Get account ID from requisition
    const requisitionRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisitionId}/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const accounts = requisitionRes.data.accounts;
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ error: "No linked bank accounts found." });
    }

    const accountId = accounts[0];

    // Get transactions with date range parameters
    // Real banks often need explicit date ranges to return transactions
    const now = new Date();
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
    const endDate = new Date(); // Use current date, not the same as now
    
    console.log(`📅 Current date: ${now.toISOString()}`);
    console.log(`📅 Start date: ${startDate.toISOString()}`);
    console.log(`📅 End date: ${endDate.toISOString()}`);
    
    const dateFrom = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dateTo = endDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`📅 Fetching transactions from ${dateFrom} to ${dateTo} for account ${accountId}`);
    
    let transactionsRes;
    try {
      // Try with date range first
      transactionsRes = await axios.get(
        `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/transactions/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            date_from: dateFrom,
            date_to: dateTo
          }
        }
      );
    } catch (dateError) {
      console.log(`⚠️ Date range fetch failed:`, dateError.message);
      
      // Check if it's a rate limit error
      if (dateError.response?.status === 429) {
        const retryAfter = dateError.response.data?.detail?.match(/try again in (\d+) seconds/);
        if (retryAfter) {
          const hours = Math.ceil(parseInt(retryAfter[1]) / 3600);
          console.log(`🚫 Rate limit exceeded. Try again in ${hours} hours.`);
          return res.status(429).json({ 
            error: "Rate limit exceeded", 
            message: `GoCardless API rate limit exceeded. Try again in ${hours} hours.`,
            retryAfter: parseInt(retryAfter[1])
          });
        }
      }
      
      // Fallback: try without date parameters
      console.log(`🔄 Trying without date parameters...`);
      try {
        transactionsRes = await axios.get(
          `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/transactions/`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } catch (fallbackError) {
        console.log(`❌ Fallback also failed:`, fallbackError.message);
        throw fallbackError;
      }
    }

    const bookedTransactions = transactionsRes.data.transactions?.booked || [];
    
    console.log(`📊 Raw API Response:`, JSON.stringify(transactionsRes.data, null, 2));
    console.log(`📊 Found ${bookedTransactions.length} booked transactions`);
    
    if (bookedTransactions.length === 0) {
      console.log(`⚠️ No transactions found. Checking for pending transactions...`);
      const pendingTransactions = transactionsRes.data.transactions?.pending || [];
      console.log(`📊 Found ${pendingTransactions.length} pending transactions`);
      
      if (pendingTransactions.length > 0) {
        console.log(`📊 Pending transactions:`, pendingTransactions.map(tx => ({
          amount: tx.transactionAmount?.amount,
          date: tx.bookingDate,
          name: tx.remittanceInformationUnstructured || tx.creditorName
        })));
      }
    } else {
      console.log(`📊 Sample transaction:`, {
        amount: bookedTransactions[0]?.transactionAmount?.amount,
        date: bookedTransactions[0]?.bookingDate,
        name: bookedTransactions[0]?.remittanceInformationUnstructured || bookedTransactions[0]?.creditorName
      });
    }

    // Categorize and save transactions
    const savedTransactions = [];
    
    for (const tx of bookedTransactions) {
      try {
        const name = tx.remittanceInformationUnstructured || tx.creditorName || "Unknown";
        
        // Try to categorize, but don't let it fail the entire process
        let category = "Uncategorized";
        try {
          category = await categorizeWithOpenRouter(name);
        } catch (catError) {
          console.warn("⚠️ Categorization failed for transaction:", name, catError.message);
          // Use simple rule-based categorization as fallback
          category = getFallbackCategory(name, parseFloat(tx.transactionAmount.amount));
        }

        const transactionData = {
          userId: req.userId,
          bankAccountId: bankAccount._id,
          amount: parseFloat(tx.transactionAmount.amount),
          category,
          date: new Date(tx.bookingDate),
          name,
          transactionId: tx.internalTransactionId || `tx-${Date.now()}-${Math.random()}`,
          type: parseFloat(tx.transactionAmount.amount) > 0 ? 'income' : 'expense'
        };

        // Check if transaction already exists to avoid duplicates
        // Check by multiple fields to be more robust
        const existingTransaction = await Transaction.findOne({
          userId: req.userId,
          $or: [
            { transactionId: transactionData.transactionId },
            { 
              name: transactionData.name,
              amount: transactionData.amount,
              date: transactionData.date,
              bankAccountId: transactionData.bankAccountId
            }
          ]
        });

        if (!existingTransaction) {
          try {
            const savedTransaction = await Transaction.create(transactionData);
            savedTransactions.push(savedTransaction);
          } catch (duplicateError) {
            if (duplicateError.code === 11000) {
              console.log('⚠️ Duplicate transaction skipped:', transactionData.name);
              // Skip this transaction, it's already in the database
            } else {
              throw duplicateError; // Re-throw if it's a different error
            }
          }
        } else {
          console.log('⚠️ Duplicate transaction found and skipped:', transactionData.name);
        }
      } catch (txError) {
        console.error("❌ Error processing individual transaction:", txError.message);
        // Continue with next transaction instead of failing the entire batch
      }
    }

    res.status(200).json({
      transactionCount: savedTransactions.length,
      transactions: savedTransactions,
      message: `Successfully imported ${savedTransactions.length} new transactions`
    });
  } catch (err) {
    console.error("Error fetching transactions:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
};

// Get bank account details
export const getBankDetails = async (req, res) => {
  try {
    console.log(`🏦 getBankDetails called for requisitionId: ${req.params.requisitionId}, userId: ${req.userId}`);
    const token = await getAccessToken();
    const { requisitionId } = req.params;

    // Check if bank account already exists in database
    let bankAccount = await BankAccount.findOne({ 
      requisitionId, 
      userId: req.userId 
    });

    if (bankAccount) {
      console.log(`🏦 Bank account already exists:`, {
        id: bankAccount._id,
        requisitionId: bankAccount.requisitionId,
        bankName: bankAccount.bankName,
        status: bankAccount.status
      });
      // Return existing bank account data
      return res.status(200).json({
        name: bankAccount.bankName,
        lastSync: bankAccount.lastSync.toLocaleDateString(),
        accountId: bankAccount.accountId,
        status: bankAccount.status,
        balance: bankAccount.balance,
        currency: bankAccount.currency
      });
    }

    console.log(`🏦 Bank account not found, creating new one for requisitionId: ${requisitionId}`);

    // Get requisition details
    const requisitionRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisitionId}/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const accounts = requisitionRes.data.accounts;
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ error: "No linked bank accounts found." });
    }

    const accountId = accounts[0];

    // Get account details
    const accountRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const accountData = accountRes.data;
    
    // Create new bank account in database
    bankAccount = new BankAccount({
      userId: req.userId,
      requisitionId: requisitionId,
      bankName: accountData.institution_id || 'Connected Bank',
      accountId: accountId,
      accountType: 'checking', // Default, can be updated later
      status: 'connected',
      lastSync: new Date(),
      balance: 0, // Will be updated when we fetch balance
      currency: accountData.currency || 'EUR'
    });

    await bankAccount.save();
    console.log(`✅ Bank account saved to database:`, {
      id: bankAccount._id,
      requisitionId: bankAccount.requisitionId,
      bankName: bankAccount.bankName,
      userId: bankAccount.userId
    });
    
    // Format bank details for frontend
    const bankDetails = {
      name: bankAccount.bankName,
      lastSync: bankAccount.lastSync.toLocaleDateString(),
      accountId: bankAccount.accountId,
      status: bankAccount.status,
      balance: bankAccount.balance,
      currency: bankAccount.currency
    };

    res.status(200).json(bankDetails);
  } catch (err) {
    console.error("Error fetching bank details:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch bank details." });
  }
};

// Get all connected banks for a user
export const getConnectedBanks = async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find({ 
      userId: req.userId,
      status: 'connected'
    }).sort({ createdAt: -1 });

    const banks = bankAccounts.map(bank => ({
      id: bank.requisitionId,
      name: bank.bankName,
      lastSync: bank.lastSync.toLocaleDateString(),
      status: bank.status,
      balance: bank.balance,
      currency: bank.currency,
      accountType: bank.accountType
    }));

    res.status(200).json(banks);
  } catch (err) {
    console.error("Error fetching connected banks:", err.message);
    res.status(500).json({ error: "Failed to fetch connected banks." });
  }
};

// Remove a connected bank
export const removeBank = async (req, res) => {
  try {
    const { requisitionId } = req.params;

    console.log(`🗑️ Removing bank account with requisitionId: ${requisitionId} for user: ${req.userId}`);

    // First, find the bank account to get its ID
    const bankAccount = await BankAccount.findOne({ 
      requisitionId, 
      userId: req.userId 
    });

    if (!bankAccount) {
      console.log(`❌ Bank account not found for requisitionId: ${requisitionId}`);
      return res.status(404).json({ error: "Bank account not found." });
    }

    console.log(`✅ Found bank account: ${bankAccount.bankName} (ID: ${bankAccount._id})`);

    // Remove all transactions associated with this bank account
    const Transaction = mongoose.model('Transaction');
    const deletedTransactions = await Transaction.deleteMany({ 
      bankAccountId: bankAccount._id 
    });
    console.log(`🗑️ Deleted ${deletedTransactions.deletedCount} transactions for bank account`);

    // Remove the bank account from database
    const deletedBank = await BankAccount.findByIdAndDelete(bankAccount._id);
    
    if (!deletedBank) {
      console.log(`❌ Failed to delete bank account from database`);
      return res.status(500).json({ error: "Failed to remove bank account." });
    }

    // Check if this was the last connected bank account
    const remainingBanks = await BankAccount.find({ userId: req.userId });
    console.log(`🏦 Remaining banks for user: ${remainingBanks.length}`);
    
    // If no banks left, clear all budgets
    if (remainingBanks.length === 0) {
      console.log('🗑️ No banks remaining, clearing all budgets...');
      const Budget = mongoose.model('Budget');
      const deletedBudgets = await Budget.updateMany(
        { userId: req.userId },
        { isActive: false }
      );
      console.log(`🗑️ Cleared ${deletedBudgets.modifiedCount} budgets`);
    }

    console.log(`✅ Successfully removed bank account: ${deletedBank.bankName}`);
    res.status(200).json({ 
      message: "Bank account removed successfully.",
      deletedTransactions: deletedTransactions.deletedCount,
      remainingBanks: remainingBanks.length
    });
  } catch (err) {
    console.error("Error removing bank:", err.message);
    res.status(500).json({ error: "Failed to remove bank account." });
  }
};

// Check requisition status
export const getRequisitionStatus = async (req, res) => {
  try {
    const token = await getAccessToken();
    const { requisitionId } = req.params;

    // Get requisition details
    const requisitionRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisitionId}/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const requisitionData = requisitionRes.data;

    // Check if requisition has accounts (means it's successful)
    const hasAccounts = requisitionData.accounts && requisitionData.accounts.length > 0;
    const status = hasAccounts ? 'SUCCEEDED' : 'PENDING';

    res.status(200).json({ 
      status: status,
      requisitionId: requisitionId,
      hasAccounts: hasAccounts,
      accounts: requisitionData.accounts || []
    });

  } catch (err) {
    console.error("Error checking requisition status:", err.response?.data || err.message);
    
    if (err.response?.status === 404) {
      res.status(404).json({ error: "Requisition not found or invalid." });
    } else {
      res.status(500).json({ error: "Failed to check requisition status." });
    }
  }
};
