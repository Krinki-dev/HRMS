'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildOtpIdentifier } = require('../shared/utils/otpIdentity');

const root = path.join(__dirname, '..');
const service = fs.readFileSync(path.join(root, 'modules/auth/auth.service.js'), 'utf8');
const routes = fs.readFileSync(path.join(root, 'modules/auth/auth.routes.js'), 'utf8');

test('OTP identifier is normalized and namespaced by immutable tenant UUID', () => {
  assert.equal(
    buildOtpIdentifier('TENANT-A', ' Person@Example.COM '),
    'tenant:tenant-a:email:person@example.com'
  );
});

test('the same email and purpose are isolated across tenants in shared public storage', () => {
  const tenantA = buildOtpIdentifier('tenant-a', 'person@example.com');
  const tenantB = buildOtpIdentifier('tenant-b', 'person@example.com');
  assert.notEqual(tenantA, tenantB);
});

test('OTP identity fails closed when tenant or email context is missing', () => {
  assert.throws(() => buildOtpIdentifier(null, 'person@example.com'), /tenant context is required/);
  assert.throws(() => buildOtpIdentifier('tenant-a', ' '), /email is required/);
});

test('OTP creation and verification both use the tenant-scoped identifier helper', () => {
  const sendStart = service.indexOf('async sendOtp(');
  const verifyStart = service.indexOf('async verifyOtp(');
  const loginStart = service.indexOf('async validateUserLogin(');
  assert.ok(sendStart >= 0 && verifyStart > sendStart && loginStart > verifyStart);
  const send = service.slice(sendStart, verifyStart);
  const verify = service.slice(verifyStart, loginStart);
  assert.match(send, /buildOtpIdentifier\(tenantId, email\)/);
  assert.match(send, /identifier,/);
  assert.match(verify, /buildOtpIdentifier\(tenantId, email\)/);
  assert.match(verify, /identifier,/);
});

test('OTP verification route passes the resolved tenant identity to the service', () => {
  assert.match(routes, /authService\.verifyOtp\(activeDb, tenantId, normalizedEmail, otp, purpose\)/);
});

test('OTP request context rejects a conflicting caller-selected tenant', () => {
  const start = routes.indexOf('async function getActiveContext');
  const end = routes.indexOf("router.post('/send-otp'", start);
  const resolver = routes.slice(start, end);
  assert.match(resolver, /requestTenantId !== resolvedTenantId/);
  assert.match(resolver, /const selectedTenantId = req\.body\?\.tenantId \|\| null/);
});
