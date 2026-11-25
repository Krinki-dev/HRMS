'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isPaidStorageReady } = require('../modules/platform/paidStorageGuard');

test('paid cloud plans require ready dedicated schemas', () => {
  assert.equal(isPaidStorageReady({ db_mode: 'cloud', storage_tier: 'dedicated_schema', storage_status: 'ready' }, 'pro'), true);
  assert.equal(isPaidStorageReady({ db_mode: 'cloud', storage_tier: 'shared', storage_status: 'ready' }, 'pro'), false);
  assert.equal(isPaidStorageReady({ db_mode: 'cloud', storage_tier: 'dedicated_schema', storage_status: 'provisioning' }, 'pro'), false);
});

test('dedicated customer-managed PostgreSQL databases can activate paid plans', () => {
  for (const db_mode of ['local', 'external_cloud']) {
    assert.equal(isPaidStorageReady({ db_mode, storage_tier: 'dedicated_database', storage_status: 'ready' }, 'pro'), true);
  }
});

test('platform-managed dedicated database is restricted to Enterprise', () => {
  const tenant = { db_mode: 'cloud', storage_tier: 'dedicated_database', storage_status: 'ready' };
  assert.equal(isPaidStorageReady(tenant, 'enterprise'), true);
  assert.equal(isPaidStorageReady(tenant, 'pro'), false);
});
