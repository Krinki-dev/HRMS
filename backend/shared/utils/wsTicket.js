/**
 * wsTicket.js
 * Phase-0: Short-lived WebSocket upgrade tickets.
 *
 * Problem: Passing JWT in the WS upgrade URL query string exposes it in server
 * access logs and browser history. This module issues a one-time 15-second
 * ticket that the client exchanges during the WS upgrade handshake.
 *
 * Flow:
 *   1. Authenticated client calls  POST /api/v1/auth/ws-ticket
 *   2. Server returns { ticket: "<uuid>" } (valid 15 seconds)
 *   3. Client opens  ws://host/ws?ticket=<uuid>
 *   4. server.js validates ticket and retrieves userId, then destroys the ticket
 *
 * Usage in auth.routes.js:
 *   const { issueTicket } = require('../../shared/utils/wsTicket');
 *   router.post('/ws-ticket', auth, (req, res) => {
 *     const ticket = issueTicket(req.user.id);
 *     return sendSuccess(res, { ticket });
 *   });
 *
 * Usage in server.js upgrade handler:
 *   const { consumeTicket } = require('./shared/utils/wsTicket');
 *   const userId = consumeTicket(query.ticket);
 *   if (!userId) { socket.destroy(); return; }
 */

const crypto = require('crypto');

/** @type {Map<string, { userId: string, expiresAt: number }>} */
const store = new Map();

const TICKET_TTL_MS = 15_000; // 15 seconds

// Lazy GC — purge expired tickets when the store grows large
function gc() {
  if (store.size < 200) return;
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expiresAt < now) store.delete(k);
  }
}

/**
 * Issues a one-time ticket for the given userId.
 * @param {string} userId
 * @returns {string} ticket UUID
 */
function issueTicket(userId) {
  gc();
  const ticket = crypto.randomUUID();
  store.set(ticket, { userId, expiresAt: Date.now() + TICKET_TTL_MS });
  return ticket;
}

/**
 * Consumes a ticket (one-time use). Returns userId or null.
 * @param {string} ticket
 * @returns {string|null}
 */
function consumeTicket(ticket) {
  if (!ticket) return null;
  const record = store.get(ticket);
  store.delete(ticket); // always delete — one-time use
  if (!record) return null;
  if (record.expiresAt < Date.now()) return null;
  return record.userId;
}

module.exports = { issueTicket, consumeTicket };
