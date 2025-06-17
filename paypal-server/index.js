require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Use sandbox for testing

// Get PayPal access token
async function getAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  const response = await axios({
    url: `${PAYPAL_API}/v1/oauth2/token`,
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    auth: {
      username: PAYPAL_CLIENT_ID,
      password: PAYPAL_CLIENT_SECRET,
    },
    data: 'grant_type=client_credentials',
  });
  return response.data.access_token;
}

// Create PayPal order
app.post('/create-order', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const order = await axios({
      url: `${PAYPAL_API}/v2/checkout/orders`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      data: {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: req.body.amount || '10.00', // You can pass amount from frontend
          },
        }],
      },
    });
    res.json(order.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Capture PayPal order
app.post('/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body;
    const accessToken = await getAccessToken();
    const capture = await axios({
      url: `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    res.json(capture.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`PayPal server running on http://localhost:${PORT}`)); 