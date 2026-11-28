'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { selectPasswordResetWorkspace } = require('../shared/utils/passwordResetWorkspace');

const choices = [
  { tenantId: 'tenant-a', subdomain: 'alpha', companyName: 'Alpha' },
  { tenantId: 'tenant-b', subdomain: 'beta', companyName: 'Beta' },
];

test('password reset selects the only eligible workspace automatically', () => {
  assert.deepEqual(selectPasswordResetWorkspace([choices[0]]), {
    status: 'selected', tenant: choices[0],
  });
});

test('password reset refuses arbitrary selection for multi-workspace email', () => {
  assert.deepEqual(selectPasswordResetWorkspace(choices), {
    status: 'selection_required', tenant: null,
  });
});

test('password reset accepts an explicitly selected membership', () => {
  assert.deepEqual(selectPasswordResetWorkspace(choices, 'tenant-b'), {
    status: 'selected', tenant: choices[1],
  });
});

test('password reset uses the request workspace when hosted on a tenant subdomain', () => {
  assert.deepEqual(selectPasswordResetWorkspace(choices, null, 'tenant-a'), {
    status: 'selected', tenant: choices[0],
  });
});

test('password reset rejects a body workspace that conflicts with request tenant', () => {
  assert.deepEqual(selectPasswordResetWorkspace(choices, 'tenant-b', 'tenant-a'), {
    status: 'invalid_selection', tenant: null,
  });
});

test('password reset rejects a workspace that is not an eligible membership', () => {
  assert.deepEqual(selectPasswordResetWorkspace(choices, 'tenant-c'), {
    status: 'invalid_selection', tenant: null,
  });
});

test('forgot-password route contains no unordered Central membership fallback', () => {
  const route = fs.readFileSync(path.join(__dirname, '../modules/auth/auth.routes.js'), 'utf8');
  const start = route.indexOf("router.post('/forgot-password'");
  const end = route.indexOf("router.post('/reset-password'", start);
  assert.ok(start >= 0 && end > start, 'forgot-password route should be present');
  const handler = route.slice(start, end);
  assert.doesNotMatch(handler, /LIMIT\s+1/i);
  assert.match(handler, /selectPasswordResetWorkspace/);
  assert.match(handler, /resolveCompanyForEmail/);
  assert.match(handler, /company_id: companyResolution\\.companyId/);
  assert.match(handler, /activeDb\.password_resets\.create/);
  assert.match(handler, /sendPasswordReset\(activeDb, tenantId/);
});
