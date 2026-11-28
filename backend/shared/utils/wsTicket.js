'use strict';

const crypto = require('crypto');

/**
 * One-time WebSocket ticket carrying the authenticated, immutable workspace
 * identity. A ticket must never be issued from browser-supplied tenant values.
 */
const store = new Map();
const TICKET_TTL_MS = 15_000;

function gc() {
  if (store.size < 200) return;
  const now = Date.now();
  for (const [key, value] of store) {
    if (value.expiresAt < now) store.delete(key);
  }
}

function issueTicket({ userId, tenantId, companyId } = {}) {
  if (![userId, tenantId, companyId].every((value) => typeof value === 'string' && value.trim())) {
    throw new TypeError('Verified userId, tenantId and companyId are required to issue a WebSocket ticket.');
  }

  gc();
  const ticket = crypto.randomUUID();
  store.set(ticket, {
    userId,
    tenantId,
    companyId,
    expiresAt: Date.now() + TICKET_TTL_MS,
  });
  return ticket;
}

function consumeTicket(ticket) {
  if (!ticket) return null;
  const record = store.get(ticket);
  store.delete(ticket);
  if (!record || record.expiresAt < Date.now()) return null;
  const { userId, tenantId, companyId } = record;
  return { userId, tenantId, companyId };
}

module.exports = { issueTicket, consumeTicket };
