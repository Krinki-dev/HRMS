/**
 * backend/shared/services/billingLogger.js
 *
 * Central, append-only audit trail for the payments/subscription/plan module.
 * Every write is wrapped in try/catch so a logging failure can NEVER crash
 * or block a real payment/webhook flow — it only ever misses a log line.
 *
 * Usage (from payment.controller.js or anywhere else):
 *   const billingLogger = require('../../shared/services/billingLogger');
 *   await billingLogger.log({
 *     tenantId: updated?.tenant_id,
 *     gateway: 'razorpay',
 *     eventType: 'payment_captured',
 *     status: 'success',
 *     referenceId: invoiceId,
 *     amountPaise: payload.amount,
 *     message: 'Invoice marked paid via webhook',
 *     metadata: { event },
 *     req, // optional, used only to capture ip_address
 *   });
 *
 * NEVER pass full card numbers, bank account numbers, CVV, OTPs, or raw
 * signatures into `metadata` — only IDs and non-sensitive status fields.
 */

const { centralPrisma } = require('../utils/centralPrisma');
const logger = require('../utils/logger');

const ALLOWED_GATEWAYS = ['razorpay', 'phonepe', 'jiopay', 'system'];
const ALLOWED_STATUS = ['info', 'success', 'warning', 'error'];

function getIp(req) {
  if (!req) return null;
  return (
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

/**
 * Strips likely-sensitive keys out of metadata before it ever touches the DB.
 * Defense in depth — callers should already avoid sending this stuff.
 */
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return metadata;
  const BLOCKED_KEYS = [
    'card', 'cvv', 'card_number', 'account_number', 'bank_account',
    'otp', 'password', 'signature', 'secret', 'key', 'token',
  ];
  const clean = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (BLOCKED_KEYS.some((b) => k.toLowerCase().includes(b))) continue;
    clean[k] = v;
  }
  return clean;
}

async function log({
  tenantId = null,
  gateway = 'system',
  eventType,
  status = 'info',
  referenceId = null,
  amountPaise = null,
  message = null,
  metadata = null,
  req = null,
}) {
  try {
    if (!eventType) {
      logger.warn('[billingLogger] Skipped log: eventType is required');
      return;
    }
    const safeGateway = ALLOWED_GATEWAYS.includes(gateway) ? gateway : 'system';
    const safeStatus = ALLOWED_STATUS.includes(status) ? status : 'info';

    await centralPrisma.billing_events.create({
      data: {
        tenant_id: tenantId || null,
        gateway: safeGateway,
        event_type: eventType,
        status: safeStatus,
        reference_id: referenceId ? String(referenceId) : null,
        amount_paise: amountPaise ?? null,
        message,
        metadata: sanitizeMetadata(metadata),
        ip_address: getIp(req),
      },
    });
  } catch (err) {
    // Logging must never break the real billing flow.
    logger.error('[billingLogger] Failed to write billing event (non-fatal):', err);
  }
}

/** Convenience wrapper for the highest-risk case: an invalid webhook signature. */
async function logInvalidSignature({ gateway, referenceId = null, req = null, metadata = null }) {
  return log({
    gateway,
    eventType: 'signature_invalid',
    status: 'error',
    referenceId,
    message: `Rejected webhook: signature verification failed (${gateway})`,
    metadata,
    req,
  });
}

module.exports = { log, logInvalidSignature };