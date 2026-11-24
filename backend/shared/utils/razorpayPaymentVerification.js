'use strict';

const crypto = require('crypto');

function verifyRazorpaySignature({ orderId, paymentId, signature, secret } = {}) {
  if (![orderId, paymentId, signature, secret].every((value) => typeof value === 'string' && value.length > 0)) {
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

module.exports = { verifyRazorpaySignature, isRazorpayPaymentForInvoice };
