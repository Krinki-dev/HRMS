'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const service = fs.readFileSync(path.join(root, 'modules/auth/auth.service.js'), 'utf8');
const routes = fs.readFileSync(path.join(root, 'modules/auth/auth.routes.js'), 'utf8');
const loginPage = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/auth/SmartLoginPage.jsx'), 'utf8');
const forgotPage = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/auth/ForgotPasswordPage.jsx'), 'utf8');

test('company lookup resolves only the user indexed to the selected Central tenant', () => {
  const start = service.indexOf('async resolveUserIdentity(');
  const end = service.indexOf('async lookupCompanies(', start);
  const method = service.slice(start, end);
  assert.match(method, /central_user_index\.findMany/);
  assert.match(method, /company_id: tenantId/);
  assert.match(method, /user_id: true/);
  assert.match(method, /db\.users\.findFirst/);
  assert.match(method, /id: memberships\[0\]\.user_id/);
  assert.match(method, /requestedCompanyId !== user\.company_id/);
});

test('password login binds the user lookup to tenant-indexed user ID and company ID', () => {
  const start = service.indexOf('async validateUserLogin(');
  const end = service.indexOf('async isPlatformAdmin(', start);
  const method = service.slice(start, end);
  assert.match(method, /resolveUserIdentity\(db, tenantId, email, companyId\)/);
  assert.match(method, /id: identity\.userId/);
  assert.match(method, /company_id: identity\.companyId/);
  assert.doesNotMatch(method, /findFirst\(\{\s*where:\s*\{\s*email:/);
});

test('login route passes selected tenant and operational company IDs', () => {
  assert.match(routes, /validateUserLogin\(activeDb, tenantId, normalizedEmail, password, companyId\)/);
});

test('OTP send and verify bind to tenant and operational company identity', () => {
  assert.match(service, /buildOtpIdentifier\(tenantId, companyId, email\)/);
  assert.match(routes, /sendOtp\(activeDb, tenantId, companyResolution\.companyId, normalizedEmail, purpose\)/);
  assert.match(routes, /verifyOtp\(activeDb, tenantId, companyId, normalizedEmail, otp, purpose\)/);
  assert.match(routes, /id: companyResolution\.userId, email: normalizedEmail, company_id: companyId/);
});

test('forgot-password resolves a tenant-indexed operational user before creating reset token', () => {
  const start = routes.indexOf("router.post('/forgot-password'");
  const end = routes.indexOf("router.post('/reset-password'", start);
  const route = routes.slice(start, end);
  assert.match(route, /resolveCompanyForEmail\(activeDb, tenantId, normalizedEmail, requestedCompanyId\)/);
  assert.match(route, /id: companyResolution\.userId, email: normalizedEmail, company_id: companyId/);
  assert.match(route, /activeDb\.password_resets\.create/);
});

test('login UI submits the selected company ID', () => {
  assert.match(loginPage, /companyId: selectedCompanyId \|\| company\?\.companyId \|\| null/);
  assert.match(loginPage, /Choose your legal company/);
});

test('forgot-password UI submits the selected company ID', () => {
  assert.match(forgotPage, /companyId,/);
  assert.match(forgotPage, /Legal Company/);
});
