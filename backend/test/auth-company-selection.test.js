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

test('company lookup returns operational company IDs for active user memberships', () => {
  const start = service.indexOf('async lookupCompanies(');
  const end = service.indexOf('async validateUserLogin(', start);
  const method = service.slice(start, end);
  assert.match(method, /db\.users\.findMany/);
  assert.match(method, /company_id: true/);
  assert.match(method, /company: \{ select: \{ name: true, is_active: true, deleted_at: true \} \}/);
});

test('password login cannot select an arbitrary user by email', () => {
  const start = service.indexOf('async validateUserLogin(');
  const end = service.indexOf('async isPlatformAdmin(', start);
  const method = service.slice(start, end);
  assert.match(method, /db\.users\.findMany/);
  assert.match(method, /company_id: companyId/);
  assert.match(method, /COMPANY_SELECTION_REQUIRED/);
  assert.doesNotMatch(method, /db\.users\.findFirst/);
});

test('login route passes selected operational company ID to auth service', () => {
  assert.match(routes, /validateUserLogin\(activeDb, normalizedEmail, password, companyId\)/);
});

test('OTP send and verify bind to selected tenant and operational company', () => {
  assert.match(service, /buildOtpIdentifier\(tenantId, companyId, email\)/);
  assert.match(routes, /sendOtp\(activeDb, tenantId, companyResolution\.companyId, normalizedEmail, purpose\)/);
  assert.match(routes, /verifyOtp\(activeDb, tenantId, companyId, normalizedEmail, otp, purpose\)/);
  assert.match(routes, /company_id: companyId, is_active: true/);
});

test('forgot-password resolves the selected operational company before finding the user', () => {
  const start = routes.indexOf("router.post('/forgot-password'");
  const end = routes.indexOf("router.post('/reset-password'", start);
  const route = routes.slice(start, end);
  assert.match(route, /resolveCompanyForEmail\(activeDb, normalizedEmail, requestedCompanyId\)/);
  assert.match(route, /company_id: companyId/);
});

test('login UI sends selected operational company ID', () => {
  assert.match(loginPage, /companyId: selectedCompanyId \|\| company\?\.companyId \|\| null/);
  assert.match(loginPage, /Choose your legal company/);
});

test('forgot-password UI sends selected operational company ID', () => {
  assert.match(forgotPage, /companyId,/);
  assert.match(forgotPage, /Legal Company/);
});
