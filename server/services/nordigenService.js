const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const NORDIGEN_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';
let accessToken = null;

// STEP 1: Get access token
async function getAccessToken() {
  const response = await axios.post(`${NORDIGEN_BASE_URL}/token/new/`, {
    secret_id: process.env.NORDIGEN_SECRET_ID,
    secret_key: process.env.NORDIGEN_SECRET_KEY,
  });

  accessToken = response.data.access;
  return accessToken;
}

module.exports = {
  getAccessToken,
  // (add more functions: listInstitutions, createRequisition, fetchTransactions, etc.)
};
