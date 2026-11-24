'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { checkModuleEnabled, isModuleEnabled } = require('../shared/middleware/permission');

test('module entitlement matching is case-insensitive and exact', () => {
  assert.equal(isModuleEnabled(['Employees', 'attendance'], 'employees'), true);
  assert.equal(isModuleEnabled(['payroll'], 'pay'), false);
  assert.equal(isModuleEnabled([], 'payroll'), false);
  assert.equal(isModuleEnabled(null, 'payroll'), false);
});

test('module middleware denies a tenant whose module is not in the server-resolved entitlement list', () => {
  let statusCode;
  let payload;
  let nextCalled = false;
  const req = { user: { role: 'Admin', is_platform_admin: false }, tenant: { id: 'tenant-a', enabledModules: ['employees'] } };
  const res = {
    status(code) { statusCode = code; return this; },
    json(body) { payload = body; return this; },
  };
  checkModuleEnabled('payroll')(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 403);
  assert.match(payload.message, /not enabled/i);
});

test('platform-level operator can inspect a tenant module without tenant plan entitlement', () => {
  let nextCalled = false;
  const req = { user: { is_platform_admin: true }, tenant: { enabledModules: [] } };
  checkModuleEnabled('payroll')(req, {}, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('module middleware fails closed when tenant entitlement metadata is missing', () => {
  let statusCode;
  const res = { status(code) { statusCode = code; return this; }, json() { return this; } };
  checkModuleEnabled('attendance')({ user: { is_platform_admin: false }, tenant: null }, res, () => {});
  assert.equal(statusCode, 403);
});
