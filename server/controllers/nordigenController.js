import Transaction from "../models/transaction.js";
import axios from "axios";

let access_token = null;

export const connectBank = async (req, res) => {
  try {
    // Load secrets fresh from environment
    const NORDIGEN_SECRET_ID = process.env.NORDIGEN_SECRET_ID;
    const NORDIGEN_SECRET_KEY = process.env.NORDIGEN_SECRET_KEY;

    // Debug: check if env vars are loaded (optional, remove after)
    console.log("NORDIGEN_SECRET_ID:", NORDIGEN_SECRET_ID);
    console.log("NORDIGEN_SECRET_KEY:", NORDIGEN_SECRET_KEY);

    // Step 1: Get access token
    const tokenRes = await axios.post("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
      secret_id: NORDIGEN_SECRET_ID,
      secret_key: NORDIGEN_SECRET_KEY,
    });

    access_token = tokenRes.data.access;

    // Step 2: Create requisition
    const requisitionRes = await axios.post(
      "https://bankaccountdata.gocardless.com/api/v2/requisitions/",
      {
        redirect: "http://localhost:3000/success", // Your frontend URL
        institution_id: "SANDBOXFINANCE_SFIN0000",
        reference: `ref-${Date.now()}`,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { id: requisitionId, link } = requisitionRes.data;
    res.status(200).json({ requisitionId, link });
  } catch (err) {
    console.error("❌ Error creating requisition:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    if (!access_token) {
      const tokenRes = await axios.post("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
        secret_id: process.env.NORDIGEN_SECRET_ID,
        secret_key: process.env.NORDIGEN_SECRET_KEY,
      });
      access_token = tokenRes.data.access;
    }

    const { requisitionId } = req.params;

    // Get requisition details to find account ID
    const requisitionRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisitionId}/`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const accounts = requisitionRes.data.accounts;
    if (!accounts.length) {
      return res.status(404).json({ error: "No accounts found for this requisition" });
    }

    const accountId = accounts[0];

    // Fetch transactions for the account
    const transactionsRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/transactions/`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const transactions = transactionsRes.data.transactions.booked;

    // Save transactions in DB
    const savedTransactions = await Transaction.insertMany(
      transactions.map(tx => ({
        userId: req.userId, // Make sure your auth middleware sets req.userId
        amount: parseFloat(tx.transactionAmount.amount),
        category: tx.transactionCategory || 'Uncategorized',
        date: new Date(tx.bookingDate),
        name: tx.remittanceInformationUnstructured || tx.creditorName || 'Unknown',
      }))
    );

    res.status(200).json(savedTransactions);
  } catch (err) {
    console.error("❌ Error fetching transactions:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
};
