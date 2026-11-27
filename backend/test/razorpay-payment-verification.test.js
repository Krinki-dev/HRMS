'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const {
  verifyRazorpaySignature,
  isRazorpayPaymentForInvoice,
  verifyRazorpayWebhookSignature,
} = require('../shared/utils/razorpayPaymentVerification');

const secret = 'test-secret';
const orderId = 'order_123';
const paymentId = 'pay_456';
const signature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
const invoice = { invoice_no: 'INV-001', total_paise: 125000, currency: 'INR' };
const order = { id: orderId, receipt: invoice.invoice_no, amount: invoice.total_paise, currency: 'INR' };
const payment = { order_id: orderId, amount: invoice.total_paise, currency: 'INR', status: 'captured' };

test('accepts a valid Razorpay order/payment signature', () => {
  assert.equal(verifyRazorpaySignature({ orderId, paymentId, signature, secret }), true);
});

test('rejects missing, altered, or incorrectly signed payment data', () => {
  assert.equal(verifyRazorpaySignature({ orderId, paymentId, signature, secret: '' }), false);
  assert.equal(verifyRazorpaySignature({ orderId, paymentId, signature: '', secret }), false);
  assert.equal(verifyRazorpaySignature({ orderId, paymentId, signature: signature + 'zz', secret }), false);
  assert.equal(verifyRazorpaySignature({ orderId, paymentId: 'pay_other', signature, secret }), false);
});

test('accepts only a captured payment matching the server invoice and gateway order', () => {
  assert.equal(isRazorpayPaymentForInvoice({ order, payment, invoice }), true);
  assert.equal(isRazorpayPaymentForInvoice({ order, payment: { ...payment, status: 'authorized' }, invoice }), false);
  assert.equal(isRazorpayPaymentForInvoice({ order, payment: { ...payment, amount: 1 }, invoice }), false);
  assert.equal(isRazorpayPaymentForInvoice({ order: { ...order, receipt: 'OTHER' }, payment, invoice }), false);
  assert.equal(isRazorpayPaymentForInvoice({ order, payment: { ...payment, order_id: 'order_other' }, invoice }), false);
});

test('verifies Razorpay webhook signatures against exact raw request bytes', () => {
  const rawBody = Buffer.from('{"event":"payment.captured","payload":{"id":1}}');
  const webhookSecret = 'webhook-test-secret';
  const valid = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  assert.equal(verifyRazorpayWebhookSignature({ rawBody, signature: valid, secret: webhookSecret }), true);
  assert.equal(verifyRazorpayWebhookSignature({ rawBody: Buffer.from(rawBody.toString() + ' '), signature: valid, secret: webhookSecret }), false);
  assert.equal(verifyRazorpayWebhookSignature({ rawBody, signature: valid, secret: '' }), false);
  assert.equal(verifyRazorpayWebhookSignature({ rawBody, signature: 'invalid', secret: webhookSecret }), false);
});


test('payment verification rejects client-supplied mock mode before gateway verification or ledger mutation', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const controller = fs.readFileSync(path.join(__dirname, '../modules/platform/payment.controller.js'), 'utf8');
  const start = controller.indexOf('exports.verifyPayment = async');
  const end = controller.indexOf('/**', start + 10);
  const handler = controller.slice(start, end > start ? end : undefined);
  const mockGuard = handler.indexOf("if (mock)");
  const signatureCheck = handler.indexOf('verifyRazorpaySignature(');
  const invoiceMutation = handler.indexOf('tx.invoices.updateMany');
  assert.ok(mockGuard >= 0);
  assert.ok(signatureCheck > mockGuard);
  assert.ok(invoiceMutation > signatureCheck);
  assert.match(handler.slice(mockGuard, mockGuard + 240), /Client-side mock payments are not accepted/);
  assert.doesNotMatch(handler, /if\s*\(!mock\)/);
});
