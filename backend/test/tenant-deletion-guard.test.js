'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { STORAGE_TIERS, STORAGE_STATUSES } = require('../shared/utils/tenantStorageConfig');
const { getSafeDeletionTarget } = require('../modules/platform/tenantDeletionGuard');

const id = '2c6b9b7a-8d52-4b2f-9d47-8c1e6b8b1a10';
const schema = 'tenant_2c6b9b7a8d524b2f9d478c1e6b8b1a10';
const base = {
  id,
  storage_tier: STORAGE_TIERS.DEDICATED_SCHEMA,
  storage_status: STORAGE_STATUSES.READY,
  schema_name: schema,
};

test('allows only a ready dedicated schema owned by the tenant UUID', () => {
  assert.deepEqual(getSafeDeletionTarget(base), { kind: 'dedicated_schema', schemaName: schema });
});

test('blocks shared schemas', () => {
  assert.throws(
    () => getSafeDeletionTarget({ ...base, storage_tier: STORAGE_TIERS.SHARED, schema_name: 'shared_tenants' }),
    { code: 'SHARED_STORAGE_DELETE_BLOCKED' }
  );
});

test('blocks legacy, pending, provisioning and failed storage', () => {
  assert.throws(() => getSafeDeletionTarget({ id, schema_name: schema }), { code: 'TENANT_STORAGE_NOT_READY' });
  for (const status of [STORAGE_STATUSES.PENDING, STORAGE_STATUSES.PROVISIONING, STORAGE_STATUSES.FAILED, STORAGE_STATUSES.LEGACY]) {
    assert.throws(() => getSafeDeletionTarget({ ...base, storage_status: status }));
  }
});

test('blocks dedicated database until a database-level deletion workflow exists', () => {
  assert.throws(
    () => getSafeDeletionTarget({ ...base, storage_tier: STORAGE_TIERS.DEDICATED_DATABASE, schema_name: null }),
    { code: 'DEDICATED_DATABASE_DELETE_UNSUPPORTED' }
  );
});

test('blocks mismatched or unsafe schema names', () => {
  assert.throws(() => getSafeDeletionTarget({ ...base, schema_name: 'tenant_someone_else' }), {
    code: 'TENANT_SCHEMA_OWNERSHIP_MISMATCH'
  });
  assert.throws(() => getSafeDeletionTarget({ ...base, schema_name: 'public; DROP SCHEMA public' }), {
    code: 'TENANT_SCHEMA_INVALID'
  });
});
