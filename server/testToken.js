// server/testToken.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function getAccessToken() {
  const url = 'https://bankaccountdata.gocardless.com/api/v2/token/new/';
  const body = {
    secret_id: process.env.NORDIGEN_SECRET_ID,
    secret_key: process.env.NORDIGEN_SECRET_KEY,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error fetching token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Access Token:', data.access);
    console.log('Refresh Token:', data.refresh);
  } catch (error) {
    console.error(error);
  }
}

getAccessToken();
