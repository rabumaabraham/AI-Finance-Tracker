// server/controllers/nordigenController.js
import axios from "axios";
import Transaction from "../models/transaction.js";
import { categorizeWithGemini } from "../services/geminiService.js"; // AI categorizer
import dotenv from "dotenv";

dotenv.config();

let access_token = null;

// Fetch new access token if missing or expired
const getAccessToken = async () => {
  if (access_token) return access_token;

  const { data } = await axios.post("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
    secret_id: process.env.NORDIGEN_SECRET_ID,
    secret_key: process.env.NORDIGEN_SECRET_KEY,
  });

  access_token = data.access;
  return access_token;
};

// Step 1: Connect user to bank (requisition)
export const connectBank = async (req, res) => {
  try {
    const token = await getAccessToken();

    const requisitionRes = await axios.post(
      "https://bankaccountdata.gocardless.com/api/v2/requisitions/",
      {
        redirect: "http://localhost:3000/success",
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
    console.error("❌ Error connecting bank:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to connect bank." });
  }
};

// Step 2: Fetch & categorize user transactions
export const getTransactions = async (req, res) => {
  try {
    const token = await getAccessToken();
    const { requisitionId } = req.params;

    // Step 2a: Get account ID from requisition
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

    // Step 2b: Get transactions
    const transactionsRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/transactions/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const bookedTransactions = transactionsRes.data.transactions?.booked || [];

    // Step 2c: Categorize + Save
    const savedTransactions = await Transaction.insertMany(
      await Promise.all(
        bookedTransactions.map(async (tx) => {
          const name = tx.remittanceInformationUnstructured || tx.creditorName || "Unknown";
          const category = await categorizeWithGemini(name); // AI magic 🧠

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
    console.error("❌ Error fetching transactions:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
};
