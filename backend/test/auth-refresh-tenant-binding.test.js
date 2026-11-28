'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const authRoutes = fs.readFileSync(path.join(__dirname, '../modules/auth/auth.routes.js'), 'utf8');
const loginPage = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/auth/SmartLoginPage.jsx'), 'utf8');

test('password login sends the selected immutable workspace UUID', () => {
  assert.match(loginPage, /tenantId:\s*company\?\.tenantId\s*\|\|\s*null/);
});

test('login refuses a body workspace UUID that differs from resolved request tenant', () => {
  const start = authRoutes.indexOf('async function getActiveContext');
  const end = authRoutes.indexOf("router.post('/send-otp'", start);
  const contextResolver = authRoutes.slice(start, end);
  assert.match(contextResolver, /requestTenantId !== resolvedTenantId/);
  assert.match(contextResolver, /return \{ activeDb: null, tenantId: null, isTemporary: false \}/);
  assert.match(contextResolver, /const selectedTenantId = req.body\?\.tenantId \|\| null/);
});

test('refresh resolves a signed tenant claim directly instead of requiring a user-index backfill', () => {
  const start = authRoutes.indexOf("router.post('/refresh'");
  const end = authRoutes.indexOf("router.post('/logout'", start);
  const refresh = authRoutes.slice(start, end);
  assert.match(refresh, /decoded\.centralTenantId && req\.tenant\?\.id/);
  assert.match(refresh, /authService\.resolveTenantDbById\(resolvedCentralTenantId\)/);
  assert.match(refresh, /if \(!resolvedCentralTenantId\)/);
  assert.match(refresh, /memberships\.length !== 1/);
  assert.doesNotMatch(refresh, /activeDb = centralPrisma/);
});

test('refresh rejects a tenant or operational company identity mismatch', () => {
  const start = authRoutes.indexOf("router.post('/refresh'");
  const end = authRoutes.indexOf("router.post('/logout'", start);
  const refresh = authRoutes.slice(start, end);
  assert.match(refresh, /decoded\.centralTenantId !== req\.tenant\.id/);
  assert.match(refresh, /decoded\.companyId !== user\.company_id/);
});
