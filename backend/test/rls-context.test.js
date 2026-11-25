'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { withTenantRLS, withPlatformAdminRLS } = require('../shared/utils/rlsContext');

function mockPrisma() {
  const calls = [];
  const tx = {
    $queryRaw: async (strings, ...values) => {
      calls.push({ sql: strings.join('?'), values });
      return [];
    },
  };
  return {
    calls,
    prisma: {
      $transaction: async (callback) => callback(tx),
    },
  };
}

test('withTenantRLS binds tenant id as a query parameter', async () => {
  const { prisma, calls } = mockPrisma();
  const hostileValue = "tenant-id'; SELECT pg_sleep(10); --";
  const result = await withTenantRLS(prisma, hostileValue, async () => 'scoped');
  assert.equal(result, 'scoped');
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /set_config\('app\.current_tenant', \?, true\)/);
  assert.deepEqual(calls[0].values, [hostileValue]);
});

test('withTenantRLS rejects a missing tenant id before opening a transaction', async () => {
  let opened = false;
  const prisma = { $transaction: async () => { opened = true; } };
  assert.throws(() => withTenantRLS(prisma, null, async () => null), /tenantId is required/);
  assert.equal(opened, false);
});

test('withPlatformAdminRLS scopes the admin flag inside the same transaction', async () => {
  const { prisma, calls } = mockPrisma();
  await withPlatformAdminRLS(prisma, async () => 'admin');
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /set_config\('jwt\.claims\.is_platform_admin', 'true', true\)/);
  assert.deepEqual(calls[0].values, []);
});
