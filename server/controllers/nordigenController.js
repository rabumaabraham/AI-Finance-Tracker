// Bank Connection Controller
import axios from "axios";
import Transaction from "../models/transaction.js";
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
            amount: parseFloat(tx.transactionAmount.amount),
            category,
            date: new Date(tx.bookingDate),
            name,
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
    
    // Format bank details for frontend
    const bankDetails = {
      name: accountData.institution_id || 'Connected Bank',
      lastSync: new Date().toLocaleDateString(),
      accountId: accountId,
      status: 'connected'
    };

    res.status(200).json(bankDetails);
  } catch (err) {
    console.error("Error fetching bank details:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch bank details." });
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
