'use strict';

const crypto = require('crypto');

function verifyRazorpaySignature({ orderId, paymentId, signature, secret } = {}) {
  if (![orderId, paymentId, secret].every((value) => typeof value === 'string' && value.length > 0) ||
      typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  let received;
  try {
    received = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function isRazorpayPaymentForInvoice({ order, payment, invoice } = {}) {
  if (!order || !payment || !invoice) return false;
  const amount = Number(invoice.total_paise);
  const currency = String(invoice.currency || '').toUpperCase();
  return Number.isSafeInteger(amount) && amount > 0 &&
    String(order.receipt || '') === String(invoice.invoice_no || '') &&
    Number(order.amount) === amount &&
    String(order.currency || '').toUpperCase() === currency &&
    String(payment.order_id || '') === String(order.id || '') &&
    Number(payment.amount) === amount &&
    String(payment.currency || '').toUpperCase() === currency &&
    payment.status === 'captured';
}


function verifyRazorpayWebhookSignature({ rawBody, signature, secret } = {}) {
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0 ||
      typeof secret !== 'string' || secret.length === 0 ||
      typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

module.exports = {
  verifyRazorpaySignature,
  isRazorpayPaymentForInvoice,
  verifyRazorpayWebhookSignature,
};
