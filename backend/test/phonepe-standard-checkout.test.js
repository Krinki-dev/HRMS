'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getPhonePeConfig,
  getPhonePeAccessToken,
  createPhonePePayment,
  getPhonePeOrderStatus,
  isPhonePeOrderPaid,
  resetPhonePeTokenCache,
} = require('../shared/utils/phonepeStandardCheckout');

const env = {
  PHONEPE_CLIENT_ID: 'client-id',
  PHONEPE_CLIENT_SECRET: 'client-secret',
  PHONEPE_CLIENT_VERSION: '1',
  PHONEPE_ENV: 'sandbox',
};

test('selects documented sandbox and production endpoints', () => {
  const sandbox = getPhonePeConfig(env);
  assert.equal(sandbox.tokenUrl, 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token');
  assert.equal(sandbox.baseUrl, 'https://api-preprod.phonepe.com/apis/pg-sandbox');
  const production = getPhonePeConfig({ ...env, PHONEPE_ENV: 'production' });
  assert.equal(production.tokenUrl, 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token');
  assert.equal(production.baseUrl, 'https://api.phonepe.com/apis/pg');
});

test('requires all OAuth credentials before requesting a token', async () => {
  resetPhonePeTokenCache();
  await assert.rejects(
    getPhonePeAccessToken({ env: {}, http: { post: async () => { throw new Error('must not call'); } } }),
    { code: 'PHONEPE_NOT_CONFIGURED' }
  );
});

test('requests and caches an OAuth token until its expiry safety window', async () => {
  resetPhonePeTokenCache();
  let calls = 0;
  const http = { post: async (url, body, options) => {
    calls += 1;
    assert.equal(url, getPhonePeConfig(env).tokenUrl);
    assert.match(body, /grant_type=client_credentials/);
    assert.equal(options.headers['Content-Type'], 'application/x-www-form-urlencoded');
    return { data: { access_token: 'token-1', expires_at: 2000 } };
  } };
  const now = () => 1000 * 1000;
  const first = await getPhonePeAccessToken({ env, http, now });
  const second = await getPhonePeAccessToken({ env, http, now });
  assert.equal(first.token, 'token-1');
  assert.equal(second.token, 'token-1');
  assert.equal(calls, 1);
});

test('creates a v2 checkout order with O-Bearer authorization', async () => {
  resetPhonePeTokenCache();
  const calls = [];
  const http = {
    post: async (url, body, options) => {
      calls.push({ url, body, options });
      if (url.endsWith('/v1/oauth/token')) return { data: { access_token: 'token-2', expires_at: Math.floor(Date.now() / 1000) + 3600 } };
      return { data: { redirectUrl: 'https://checkout.example/redirect' } };
    },
  };
  const result = await createPhonePePayment({
    merchantOrderId: 'ORDER-1', amount: 12500, redirectUrl: 'https://merchant.example/return',
    env, http,
  });
  assert.equal(result.redirectUrl, 'https://checkout.example/redirect');
  assert.equal(calls[1].url, 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay');
  assert.equal(calls[1].options.headers.Authorization, 'O-Bearer token-2');
  assert.equal(calls[1].body.amount, 12500);
  assert.equal(calls[1].body.paymentFlow.type, 'PG_CHECKOUT');
});

test('checks v2 order status using merchant order ID', async () => {
  resetPhonePeTokenCache();
  const calls = [];
  const http = {
    post: async () => ({ data: { access_token: 'token-3', expires_at: Math.floor(Date.now() / 1000) + 3600 } }),
    get: async (url, options) => {
      calls.push({ url, options });
      return { data: { orderId: 'ORDER/2', state: 'PENDING', amount: 1000, paymentDetails: [] } };
    },
  };
  const result = await getPhonePeOrderStatus({ merchantOrderId: 'ORDER/2', env, http });
  assert.equal(result.state, 'PENDING');
  assert.equal(calls[0].url, 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/ORDER%2F2/status?details=true');
  assert.equal(calls[0].options.headers.Authorization, 'O-Bearer token-3');
});

test('accepts only a completed matching order with a completed matching payment attempt', () => {
  const paid = {
    orderId: 'ORDER-3', state: 'COMPLETED', amount: 10000,
    paymentDetails: [{ transactionId: 'TXN-3', state: 'COMPLETED', amount: 10000 }],
  };
  assert.equal(isPhonePeOrderPaid(paid, { merchantOrderId: 'ORDER-3', amount: 10000 }), true);
  assert.equal(isPhonePeOrderPaid({ ...paid, state: 'PENDING' }, { merchantOrderId: 'ORDER-3', amount: 10000 }), false);
  assert.equal(isPhonePeOrderPaid({ ...paid, amount: 1 }, { merchantOrderId: 'ORDER-3', amount: 10000 }), false);
  assert.equal(isPhonePeOrderPaid({ ...paid, orderId: 'OTHER' }, { merchantOrderId: 'ORDER-3', amount: 10000 }), false);
  assert.equal(isPhonePeOrderPaid({ ...paid, paymentDetails: [{ ...paid.paymentDetails[0], state: 'FAILED' }] }, { merchantOrderId: 'ORDER-3', amount: 10000 }), false);
});
