'use strict';

const axios = require('axios');

const TOKEN_SKEW_SECONDS = 60;
let cachedToken = null;

function getPhonePeConfig(env = process.env) {
  const mode = String(env.PHONEPE_ENV || 'sandbox').toLowerCase();
  const sandbox = mode !== 'production';
  return {
    clientId: String(env.PHONEPE_CLIENT_ID || '').trim(),
    clientSecret: String(env.PHONEPE_CLIENT_SECRET || '').trim(),
    clientVersion: String(env.PHONEPE_CLIENT_VERSION || '').trim(),
    merchantId: String(env.PHONEPE_MERCHANT_ID || '').trim(),
    baseUrl: String(env.PHONEPE_BASE_URL || (sandbox
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/pg')).replace(/\/$/, ''),
    tokenUrl: sandbox
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'
      : 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
  };
}

function resetPhonePeTokenCache() {
  cachedToken = null;
}

async function getPhonePeAccessToken({ env = process.env, http = axios, now = Date.now } = {}) {
  const config = getPhonePeConfig(env);
  if (!config.clientId || !config.clientSecret || !config.clientVersion) {
    const error = new Error('PhonePe Standard Checkout v2 credentials are not configured');
    error.code = 'PHONEPE_NOT_CONFIGURED';
    throw error;
  }
  if (cachedToken && cachedToken.expiresAtMs > now() + TOKEN_SKEW_SECONDS * 1000) {
    return { token: cachedToken.token, config };
  }
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_version: config.clientVersion,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
  });
  const response = await http.post(config.tokenUrl, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  const token = response.data?.access_token;
  const expiresAt = Number(response.data?.expires_at);
  if (!token || !Number.isFinite(expiresAt) || expiresAt <= Math.floor(now() / 1000)) {
    throw new Error('PhonePe returned an invalid or expired authorization token');
  }
  cachedToken = { token, expiresAtMs: expiresAt * 1000 };
  return { token, config };
}

async function createPhonePePayment({ merchantOrderId, amount, redirectUrl, metaInfo, env = process.env, http = axios } = {}) {
  if (!merchantOrderId || !redirectUrl || !Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) {
    throw new Error('PhonePe payment requires an order ID, redirect URL, and positive integer amount');
  }
  const { token, config } = await getPhonePeAccessToken({ env, http });
  const response = await http.post(`${config.baseUrl}/checkout/v2/pay`, {
    merchantOrderId,
    amount: Number(amount),
    expireAfter: 1200,
    paymentFlow: {
      type: 'PG_CHECKOUT',
      merchantUrls: { redirectUrl },
    },
    metaInfo: metaInfo || {},
  }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `O-Bearer ${token}`,
    },
    timeout: 20000,
  });
  if (!response.data?.redirectUrl) {
    throw new Error('PhonePe did not return a checkout redirect URL');
  }
  return { redirectUrl: response.data.redirectUrl, response: response.data };
}

async function getPhonePeOrderStatus({ merchantOrderId, env = process.env, http = axios } = {}) {
  if (!merchantOrderId) throw new Error('PhonePe merchant order ID is required');
  const { token, config } = await getPhonePeAccessToken({ env, http });
  const response = await http.get(
    `${config.baseUrl}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=true`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `O-Bearer ${token}`,
      },
      timeout: 15000,
    }
  );
  return response.data || {};
}

function isPhonePeOrderPaid(status, { merchantOrderId, amount } = {}) {
  if (!status || status.state !== 'COMPLETED' ||
      String(status.orderId || '') !== String(merchantOrderId || '') ||
      Number(status.amount) !== Number(amount)) return false;
  return Array.isArray(status.paymentDetails) &&
    status.paymentDetails.some((payment) =>
      payment?.state === 'COMPLETED' &&
      Number(payment.amount) === Number(amount) &&
      typeof payment.transactionId === 'string' &&
      payment.transactionId.length > 0
    );
}

module.exports = {
  getPhonePeConfig,
  getPhonePeAccessToken,
  createPhonePePayment,
  getPhonePeOrderStatus,
  isPhonePeOrderPaid,
  resetPhonePeTokenCache,
};
