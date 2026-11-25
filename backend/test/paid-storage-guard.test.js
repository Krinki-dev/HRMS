'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isPaidStorageReady } = require('../modules/platform/paidStorageGuard');

test('paid cloud plans require ready dedicated schemas', () => {
  const id = '2c6b9b7a-8d52-4b2f-9d47-8c1e6b8b1a10';
  const schema_name = 'tenant_2c6b9b7a8d524b2f9d478c1e6b8b1a10';
  assert.equal(isPaidStorageReady({ id, db_mode: 'cloud', schema_name, storage_tier: 'dedicated_schema', storage_status: 'ready' }, 'pro'), true);
  assert.equal(isPaidStorageReady({ db_mode: 'cloud', storage_tier: 'shared', storage_status: 'ready' }, 'pro'), false);
  assert.equal(isPaidStorageReady({ db_mode: 'cloud', storage_tier: 'dedicated_schema', storage_status: 'provisioning' }, 'pro'), false);
  assert.equal(isPaidStorageReady({ id, db_mode: 'local', schema_name, storage_tier: 'dedicated_schema', storage_status: 'ready' }, 'pro'), false);
  assert.equal(isPaidStorageReady({ id, db_mode: 'cloud', schema_name: 'tenant_wrong', storage_tier: 'dedicated_schema', storage_status: 'ready' }, 'pro'), false);
});

test('dedicated customer-managed PostgreSQL databases can activate paid plans', () => {
  for (const db_mode of ['local', 'external_cloud']) {
    assert.equal(isPaidStorageReady({ db_mode, schema_name: null, storage_tier: 'dedicated_database', storage_status: 'ready' }, 'pro'), true);
  }
});

test('platform-managed dedicated database is restricted to Enterprise', () => {
  const tenant = { db_mode: 'cloud', schema_name: null, storage_tier: 'dedicated_database', storage_status: 'ready' };
  assert.equal(isPaidStorageReady(tenant, 'enterprise'), true);
  assert.equal(isPaidStorageReady(tenant, 'pro'), false);
});
