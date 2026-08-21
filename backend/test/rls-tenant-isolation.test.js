'use strict';

/**
 * RLS + Prisma connection pooling validation.
 *
 * Proves two things against a real Postgres instance, using the exact
 * `tenant_modules` table/policy shipped in
 * backend/db-migrations/20260606_rls_and_function_fix.sql:
 *
 *   1. BROKEN pattern (current tenantSession.js): a bare
 *      `db.$executeRawUnsafe('SET LOCAL app.current_tenant = ...')` call,
 *      not wrapped in a transaction with the query that follows, has no
 *      effect on the next query — Postgres discards a `SET LOCAL` issued
 *      outside an explicit transaction block as soon as that statement's
 *      implicit transaction ends. The result is NOT a cross-tenant leak;
 *      it is fail-closed (the RLS policy sees `current_setting(...) = NULL`
 *      and matches nothing), which silently breaks the query instead of
 *      isolating it correctly.
 *
 *   2. FIXED pattern: `db.$transaction(async (tx) => { SET LOCAL ...; return
 *      tx.tenant_modules.findMany() })` scopes the session variable to that
 *      transaction only, so concurrent requests for different tenants on
 *      the same pooled PrismaClient each see only their own tenant's rows.
 *
 * Requires Docker Postgres reachable at RLS_TEST_DATABASE_URL (see
 * backend/test/README.md for the one-time setup script). Skips itself if
 * that env var is not set, so it never breaks a normal `npm test` run in
 * an environment without the throwaway database.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const APP_URL = process.env.RLS_TEST_APP_DATABASE_URL;

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';

test('RLS tenant isolation under Prisma connection pooling', { skip: !APP_URL && 'RLS_TEST_APP_DATABASE_URL not set — see backend/test/README.md' }, async (t) => {
  const { PrismaClient } = require('../shared/generated/central-client');
  const db = new PrismaClient({ datasources: { db: { url: APP_URL } } });
  t.after(() => db.$disconnect());

  await t.test('BROKEN pattern: bare SET LOCAL outside a transaction does not scope the query', async () => {
    await db.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${TENANT_A}'`);
    const rows = await db.tenant_modules.findMany({ where: { tenant_id: TENANT_A } });
    // The SET LOCAL from the previous statement is already gone (its own
    // implicit transaction ended), so the RLS policy sees no tenant set
    // and returns zero rows instead of tenant A's row.
    assert.equal(rows.length, 0, 'expected the unwrapped SET LOCAL to NOT scope the follow-up query');
  });

  await t.test('FIXED pattern: withTenantRLS isolates tenants correctly', async () => {
    const { withTenantRLS } = require('../shared/utils/rlsContext');
    const readAsTenant = (tenantId) => withTenantRLS(db, tenantId, (tx) => tx.tenant_modules.findMany());

    // Fire both tenants' reads concurrently on the SAME pooled PrismaClient
    // to prove one request's session variable can't leak into the other.
    const [rowsA, rowsB] = await Promise.all([
      readAsTenant(TENANT_A),
      readAsTenant(TENANT_B),
    ]);

    assert.equal(rowsA.length, 1);
    assert.equal(rowsA[0].tenant_id, TENANT_A);
    assert.equal(rowsB.length, 1);
    assert.equal(rowsB[0].tenant_id, TENANT_B);
  });

  await t.test('FIXED pattern (withTenantRLS) holds under repeated concurrent interleaving', async () => {
    const { withTenantRLS } = require('../shared/utils/rlsContext');
    const readAsTenant = (tenantId) => withTenantRLS(db, tenantId, (tx) => tx.tenant_modules.findMany());

    const rounds = 20;
    const results = await Promise.all(
      Array.from({ length: rounds }, (_, i) => readAsTenant(i % 2 === 0 ? TENANT_A : TENANT_B))
    );

    results.forEach((rows, i) => {
      const expectedTenant = i % 2 === 0 ? TENANT_A : TENANT_B;
      assert.equal(rows.length, 1, `round ${i}: expected exactly 1 row`);
      assert.equal(rows[0].tenant_id, expectedTenant, `round ${i}: leaked another tenant's row`);
    });
  });
});
