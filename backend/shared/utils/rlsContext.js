'use strict';

/**
 * RLS context helpers for the central database.
 *
 * Do NOT set `app.current_tenant` / `jwt.claims.*` via a bare
 * `$executeRawUnsafe('SET LOCAL ...')` call and then run a query separately
 * (e.g. from middleware, followed later by a route handler). Postgres
 * discards a `SET LOCAL` issued outside an explicit transaction block as
 * soon as that statement's own implicit transaction ends, so the very next
 * query — even the next line of the same function — no longer has it set.
 * See backend/test/rls-tenant-isolation.test.js for a reproduction against
 * a real Postgres instance.
 *
 * The only way to make `SET LOCAL` scope correctly is to issue it and run
 * the query it protects inside the SAME `$transaction`. These helpers do
 * that for the two RLS predicates used in backend/db-migrations/20260606_rls_and_function_fix.sql:
 *   - `app.current_tenant`          → tenant_modules, tenant_pricing_configs, invoices, tenant_branch_links
 *   - `jwt.claims.is_platform_admin` → tenants, central_user_index, central_kyc_records, central_gst_records, platform_settings
 */

/**
 * Runs `fn(tx)` inside a transaction with `app.current_tenant` set for the
 * given tenant, so RLS policies scoped to that predicate only return rows
 * belonging to `tenantId`.
 * @param {import('../generated/central-client').PrismaClient} prisma
 * @param {string} tenantId
 * @param {(tx: any) => Promise<any>} fn
 */
function withTenantRLS(prisma, tenantId, fn) {
  if (!tenantId) throw new Error('withTenantRLS: tenantId is required');
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
    return fn(tx);
  });
}

/**
 * Runs `fn(tx)` inside a transaction with `jwt.claims.is_platform_admin` set
 * to true, for platform-level jobs/admin routes that must read/write across
 * all tenants (e.g. billing cron, platform admin endpoints).
 * @param {import('../generated/central-client').PrismaClient} prisma
 * @param {(tx: any) => Promise<any>} fn
 */
function withPlatformAdminRLS(prisma, fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL "jwt.claims.is_platform_admin" = 'true'`);
    return fn(tx);
  });
}

module.exports = { withTenantRLS, withPlatformAdminRLS };
