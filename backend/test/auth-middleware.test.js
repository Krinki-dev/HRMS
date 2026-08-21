'use strict';

/**
 * Integration test for the primary JWT auth middleware
 * (backend/shared/middleware/auth.js), run against a real Express app and a
 * real Postgres central_user_index table — not mocked.
 *
 * Covers:
 *   - Missing/malformed Authorization header -> 401
 *   - Invalid signature / expired token -> 401 with the correct message
 *   - Valid token populates req.user from the JWT payload
 *   - is_platform_admin is sourced from central_user_index (not from the JWT
 *     payload itself), for both true and false/missing cases
 *
 * Requires a Postgres instance with the central_user_index + tenants tables
 * (see backend/test/README.md). Skips itself if AUTH_TEST_CENTRAL_DATABASE_URL
 * is not set, so it never breaks a normal `npm test` run.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const CENTRAL_DB_URL = process.env.AUTH_TEST_CENTRAL_DATABASE_URL;
const JWT_SECRET = process.env.AUTH_TEST_JWT_SECRET || 'auth-integration-test-secret-32-chars-min';

const TENANT_ID = '33333333-3333-3333-3333-333333333333';
const ADMIN_USER_ID = '44444444-4444-4444-4444-444444444444';
const REGULAR_USER_ID = '55555555-5555-5555-5555-555555555555';
const UNKNOWN_USER_ID = '66666666-6666-6666-6666-666666666666';

function signToken(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m', ...opts });
}

test('authMiddleware — JWT verification + central DB admin lookup', { skip: !CENTRAL_DB_URL && 'AUTH_TEST_CENTRAL_DATABASE_URL not set — see backend/test/README.md' }, async (t) => {
  process.env.JWT_ACCESS_SECRET = JWT_SECRET;
  process.env.CENTRAL_DATABASE_URL = CENTRAL_DB_URL;

  const express = require('express');
  const authMiddleware = require('../shared/middleware/auth');

  const app = express();
  app.get('/protected', authMiddleware, (req, res) => res.json({ user: req.user }));

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  t.after(() => server.close());

  await t.test('no Authorization header -> 401', async () => {
    const res = await fetch(`${baseUrl}/protected`);
    assert.equal(res.status, 401);
  });

  await t.test('malformed Authorization header -> 401', async () => {
    const res = await fetch(`${baseUrl}/protected`, { headers: { Authorization: 'NotBearer abc' } });
    assert.equal(res.status, 401);
  });

  await t.test('invalid signature -> 401', async () => {
    const badToken = jwt.sign({ id: REGULAR_USER_ID }, 'wrong-secret', { expiresIn: '15m' });
    const res = await fetch(`${baseUrl}/protected`, { headers: { Authorization: `Bearer ${badToken}` } });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.message, /Invalid token/i);
  });

  await t.test('expired token -> 401 with session-expired message', async () => {
    const expiredToken = signToken({ id: REGULAR_USER_ID }, { expiresIn: '-10s' });
    const res = await fetch(`${baseUrl}/protected`, { headers: { Authorization: `Bearer ${expiredToken}` } });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.message, /expired/i);
  });

  await t.test('valid token for an unknown user -> is_platform_admin defaults to false', async () => {
    const token = signToken({ id: UNKNOWN_USER_ID, email: 'ghost@example.com', role: 'employee' });
    const res = await fetch(`${baseUrl}/protected`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.id, UNKNOWN_USER_ID);
    assert.equal(body.user.is_platform_admin, false);
  });

  await t.test('valid token for a regular (non-admin) active user -> is_platform_admin false', async () => {
    const token = signToken({ id: REGULAR_USER_ID, email: 'staff@tenant-a.test', role: 'hr', tenantId: TENANT_ID });
    const res = await fetch(`${baseUrl}/protected`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.is_platform_admin, false);
    assert.equal(body.user.tenantId, TENANT_ID);
  });

  await t.test('valid token for a platform-admin active user -> is_platform_admin true (sourced from central DB, not JWT)', async () => {
    // The JWT payload itself does NOT claim is_platform_admin — proving the
    // middleware ignores any such claim in the token and looks it up server-side.
    const token = signToken({ id: ADMIN_USER_ID, email: 'admin@syntern.in', role: 'super_admin' });
    const res = await fetch(`${baseUrl}/protected`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.is_platform_admin, true);
  });
});
