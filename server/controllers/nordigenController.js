// Bank Connection Controller
import axios from "axios";
import mongoose from "mongoose";
import Transaction from "../models/transaction.js";
import BankAccount from "../models/bankAccount.js";
import { categorizeWithOpenRouter } from "../services/openrouterService.js";
import dotenv from "dotenv";

dotenv.config();

let accessToken = null;

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

    const requisitionRes = await axios.post(
      "https://bankaccountdata.gocardless.com/api/v2/requisitions/",
      {
        redirect: "http://localhost:3000/dashboard.html?status=success",
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

// Fetch and categorize transactions
export const getTransactions = async (req, res) => {
  try {
    const token = await getAccessToken();
    const { requisitionId } = req.params;

    // Find the bank account for this requisition
    const bankAccount = await BankAccount.findOne({ 
      requisitionId, 
      userId: req.userId 
    });

    if (!bankAccount) {
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

    // Get transactions
    const transactionsRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/transactions/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const bookedTransactions = transactionsRes.data.transactions?.booked || [];

    // Categorize and save transactions
    const savedTransactions = await Transaction.insertMany(
      await Promise.all(
        bookedTransactions.map(async (tx) => {
          const name = tx.remittanceInformationUnstructured || tx.creditorName || "Unknown";
          const category = await categorizeWithOpenRouter(name);

          return {
            userId: req.userId,
            bankAccountId: bankAccount._id,
            amount: parseFloat(tx.transactionAmount.amount),
            category,
            date: new Date(tx.bookingDate),
            name,
            transactionId: tx.internalTransactionId || `tx-${Date.now()}-${Math.random()}`,
            type: parseFloat(tx.transactionAmount.amount) > 0 ? 'income' : 'expense'
          };
        })
      )
    );

    res.status(200).json(savedTransactions);
  } catch (err) {
    console.error("Error fetching transactions:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
};

// Get bank account details
export const getBankDetails = async (req, res) => {
  try {
    const token = await getAccessToken();
    const { requisitionId } = req.params;

    // Check if bank account already exists in database
    let bankAccount = await BankAccount.findOne({ 
      requisitionId, 
      userId: req.userId 
    });

    if (bankAccount) {
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

    console.log(`✅ Successfully removed bank account: ${deletedBank.bankName}`);
    res.status(200).json({ 
      message: "Bank account removed successfully.",
      deletedTransactions: deletedTransactions.deletedCount
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
