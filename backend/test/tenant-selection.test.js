'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { chooseTenantRow } = require('../shared/utils/tenantSelection');

const rows = [
  { company_id: 'tenant-a', subdomain: 'alpha' },
  { company_id: 'tenant-b', subdomain: 'beta' },
];

test('selects the only eligible tenant without asking for a choice', () => {
  assert.deepEqual(chooseTenantRow([rows[0]]), rows[0]);
});

test('refuses to choose an arbitrary tenant when an email belongs to multiple tenants', () => {
  assert.equal(chooseTenantRow(rows), null);
});

test('returns only the explicitly selected tenant from multiple memberships', () => {
  assert.deepEqual(chooseTenantRow(rows, 'tenant-b'), rows[1]);
});

test('rejects a tenant selection that is not in the membership result', () => {
  assert.equal(chooseTenantRow(rows, 'tenant-c'), null);
});

test('rejects duplicate rows for the same selected tenant rather than choosing first', () => {
  assert.equal(chooseTenantRow([rows[0], { ...rows[0] }], 'tenant-a'), null);
});
