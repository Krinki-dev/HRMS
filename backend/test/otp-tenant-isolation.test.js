'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildOtpIdentifier } = require('../shared/utils/otpIdentity');

const root = path.join(__dirname, '..');
const service = fs.readFileSync(path.join(root, 'modules/auth/auth.service.js'), 'utf8');
const routes = fs.readFileSync(path.join(root, 'modules/auth/auth.routes.js'), 'utf8');

test('OTP identifier is normalized and namespaced by tenant and operational company', () => {
  assert.equal(
    buildOtpIdentifier('TENANT-A', 'COMPANY-A', ' Person@Example.COM '),
    'tenant:tenant-a:company:company-a:email:person@example.com'
  );
});

test('the same email is isolated across tenant and company contexts', () => {
  const a = buildOtpIdentifier('tenant-a', 'company-a', 'person@example.com');
  const b = buildOtpIdentifier('tenant-b', 'company-a', 'person@example.com');
  const c = buildOtpIdentifier('tenant-a', 'company-b', 'person@example.com');
  assert.notEqual(a, b);
  assert.notEqual(a, c);
});

test('OTP identity fails closed when tenant, company or email context is missing', () => {
  assert.throws(() => buildOtpIdentifier(null, 'company-a', 'person@example.com'), /tenant context is required/);
  assert.throws(() => buildOtpIdentifier('tenant-a', null, 'person@example.com'), /company context is required/);
  assert.throws(() => buildOtpIdentifier('tenant-a', 'company-a', ' '), /email is required/);
});

test('OTP creation and verification both use the same tenant/company-scoped identifier helper', () => {
  const sendStart = service.indexOf('async sendOtp(');
  const verifyStart = service.indexOf('async verifyOtp(');
  const loginStart = service.indexOf('async resolveUserIdentity(');
  assert.ok(sendStart >= 0 && verifyStart > sendStart && loginStart > verifyStart);
  const send = service.slice(sendStart, verifyStart);
  const verify = service.slice(verifyStart, loginStart);
  assert.match(send, /buildOtpIdentifier\(tenantId, companyId, email\)/);
  assert.match(send, /identifier,/);
  assert.match(verify, /buildOtpIdentifier\(tenantId, companyId, email\)/);
  assert.match(verify, /identifier,/);
});

test('OTP verification route passes the resolved tenant and company IDs to the service', () => {
  assert.match(routes, /authService\.verifyOtp\(activeDb, tenantId, companyId, normalizedEmail, otp, purpose\)/);
});

test('OTP request context rejects a conflicting caller-selected tenant', () => {
  const start = routes.indexOf('async function getActiveContext');
  const end = routes.indexOf("router.post('/send-otp'", start);
  const resolver = routes.slice(start, end);
  assert.match(resolver, /requestTenantId !== resolvedTenantId/);
  assert.match(resolver, /const selectedTenantId = req\.body\?\.tenantId \|\| null/);
});
