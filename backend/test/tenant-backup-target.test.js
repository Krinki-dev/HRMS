'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getSafeBackupTarget } = require('../shared/utils/tenantBackupTarget');

const id = '2c6b9b7a-8d52-4b2f-9d47-8c1e6b8b1a10';
const schema_name = 'tenant_2c6b9b7a8d524b2f9d478c1e6b8b1a10';
const ready = { id, schema_name, storage_tier: 'dedicated_schema', storage_status: 'ready' };

test('backup allows a verified tenant-owned schema', () => {
  assert.equal(getSafeBackupTarget(ready), schema_name);
});

test('backup refuses shared, legacy and unready storage', () => {
  for (const storage_tier of ['shared', 'legacy_unclassified', undefined]) {
    assert.throws(() => getSafeBackupTarget({ ...ready, storage_tier }));
  }
  for (const storage_status of ['pending', 'provisioning', 'failed', 'legacy_unclassified', undefined]) {
    assert.throws(() => getSafeBackupTarget({ ...ready, storage_status }));
  }
});

test('backup refuses missing, unsafe and mismatched schema', () => {
  for (const name of ['public', 'shared_tenants', 'tenant_other', 'bad";DROP SCHEMA public;', null]) {
    assert.throws(() => getSafeBackupTarget({ ...ready, schema_name: name }));
  }
});


test('backup allows a dedicated customer-managed PostgreSQL database without schema override', () => {
  assert.equal(getSafeBackupTarget({
    id,
    db_mode: 'local',
    schema_name: null,
    storage_tier: 'dedicated_database',
    storage_status: 'ready',
  }), null);
  assert.throws(() => getSafeBackupTarget({
    id,
    db_mode: 'external_cloud',
    schema_name: 'public',
    storage_tier: 'dedicated_database',
    storage_status: 'ready',
  }), /must not use a schema override/);
});
