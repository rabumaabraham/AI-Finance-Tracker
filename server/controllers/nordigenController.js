import axios from "axios";
const NORDIGEN_SECRET_ID = process.env.NORDIGEN_SECRET_ID;
const NORDIGEN_SECRET_KEY = process.env.NORDIGEN_SECRET_KEY;

let access_token = null;

// Your existing connectBank function
export const connectBank = async (req, res) => {
  try {
    // Get access token
    const tokenRes = await axios.post("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
      secret_id: NORDIGEN_SECRET_ID,
      secret_key: NORDIGEN_SECRET_KEY,
    });

    access_token = tokenRes.data.access;

    // Create requisition
    const requisitionRes = await axios.post(
      "https://bankaccountdata.gocardless.com/api/v2/requisitions/",
      {
        redirect: "http://localhost:3000/success", // your frontend redirect URL
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
    console.error("Error creating requisition:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
};

// New function to fetch transactions for a requisition ID
export const getTransactions = async (req, res) => {
  try {
    // If access_token is null or expired, get a new one
    if (!access_token) {
      const tokenRes = await axios.post("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
        secret_id: NORDIGEN_SECRET_ID,
        secret_key: NORDIGEN_SECRET_KEY,
      });
      access_token = tokenRes.data.access;
    }

    const { requisitionId } = req.params;

    // Get agreements linked to the requisition
    const agreementsRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisitionId}/agreements/`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    const agreements = agreementsRes.data.results;

    if (!agreements.length) {
      return res.status(404).json({ error: "No agreements found for this requisition" });
    }

    // For simplicity, get transactions from the first agreement
    const agreementId = agreements[0].id;

    // Fetch transactions for this agreement
    const transactionsRes = await axios.get(
      `https://bankaccountdata.gocardless.com/api/v2/agreements/${agreementId}/transactions/`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    res.status(200).json(transactionsRes.data);
  } catch (err) {
    console.error("Error fetching transactions:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
};
